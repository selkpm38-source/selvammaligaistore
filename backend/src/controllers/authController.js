'use strict';

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const User = require('../models/User');
const env = require('../config/env');
const { AppError } = require('../middlewares/errorHandler');

function createAccessToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role || 'customer',
    },
    env.jwt.accessSecret,
    {
      expiresIn: env.jwt.accessExpiresIn,
    }
  );
}

function createRefreshToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
    },
    env.jwt.refreshSecret,
    {
      expiresIn: env.jwt.refreshExpiresIn,
    }
  );
}

function sendAuthResponse(res, user, statusCode = 200) {
  const accessToken = createAccessToken(user);
  const refreshToken = createRefreshToken(user);

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: env.cookie.secure,
    sameSite: env.cookie.sameSite,
    signed: true,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.status(statusCode).json({
    success: true,
    data: {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role || 'customer',
      },
      accessToken,
    },
  });
}

async function register(req, res, next) {
  try {
    const { name, email, phone, password, referralCode } = req.body || {};

    if (!name || !email || !password) {
      throw new AppError('Name, email, and password are required.', 422);
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    const existingUser = await User.findByEmail(normalizedEmail);

    if (existingUser) {
      throw new AppError('Email already registered.', 409);
    }

    const passwordHash = await bcrypt.hash(String(password), 10);

    const user = await User.create({
      name: String(name).trim(),
      email: normalizedEmail,
      phone: phone || null,
      passwordHash,
      referralCode: referralCode || null,
    });

    if (!user) {
      throw new AppError('User registration failed.', 500);
    }

    sendAuthResponse(res, user, 201);
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    const normalizedEmail = String(email).trim().toLowerCase();

    const user = await User.findByEmail(normalizedEmail);

    if (!user) {
      throw new AppError('Invalid email or password.', 401);
    }

    if (user.status && user.status !== 'active') {
      throw new AppError('Your account is not active.', 403);
    }

    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      throw new AppError('Account temporarily locked. Try again later.', 403);
    }

    const passwordMatches = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatches) {
      const attempts = (user.failed_login_attempts || 0) + 1;
      await User.incrementFailedAttempts(user.id);

      if (attempts >= env.lockout.maxFailedAttempts) {
        const until = new Date(Date.now() + env.lockout.durationMinutes * 60 * 1000);
        await User.lockAccount(user.id, until);
      }

      throw new AppError('Invalid email or password.', 401);
    }

    await User.resetFailedAttempts(user.id);

    sendAuthResponse(res, user);
  } catch (err) {
    next(err);
  }
}

async function refresh(req, res, next) {
  try {
    const refreshToken = req.signedCookies.refreshToken;

    if (!refreshToken) {
      throw new AppError('Refresh token missing.', 401);
    }

    let decoded;

    try {
      decoded = jwt.verify(refreshToken, env.jwt.refreshSecret);
    } catch (err) {
      throw new AppError('Invalid or expired refresh token.', 401);
    }

    const user = await User.findById(decoded.sub);

    if (!user) {
      throw new AppError('User not found.', 401);
    }

    if (user.status && user.status !== 'active') {
      throw new AppError('Your account is not active.', 403);
    }

    const accessToken = createAccessToken(user);

    res.json({
      success: true,
      data: {
        accessToken,
      },
    });
  } catch (err) {
    next(err);
  }
}

async function logout(req, res, next) {
  try {
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: env.cookie.secure,
      sameSite: env.cookie.sameSite,
      signed: true,
    });

    res.json({
      success: true,
      message: 'Logged out successfully.',
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  register,
  login,
  refresh,
  logout,
};
