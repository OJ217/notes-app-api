import { Hono } from 'hono';
import { z } from 'zod';

import { BadRequestError, ConflictError, InternalError, NotFoundError } from '@/api/error';
import { ApiResponse } from '@/api/response';
import { compareHash, generateToken, hashString, verifyToken } from '@/services/auth-service';
import { sendEmail } from '@/services/mail-service';
import { findUserByEmail, findUserVerificationDetails, insertUserWithVerification, upsertUserVerification, verifyUser } from '@/services/user-service';
import { dateIsPast, generateOtp } from '@/utils';
import { zValidator } from '@hono/zod-validator';
import { EmailType } from '@/types';

const authRouter = new Hono();

authRouter.post(
	'/log-in',
	zValidator(
		'json',
		z.object({
			email: z.string().email(),
			password: z.string().min(1).max(64),
		})
	),
	async c => {
		const { email, password } = c.req.valid('json');

		const user = await findUserByEmail(email);

		if (!user) {
			throw new NotFoundError('User not found. Please sign up.');
		}

		if (!user.emailVerified) {
			throw new BadRequestError('Email not verified. Verify your email before proceeding.');
		}

		if (!user.password) {
			throw new BadRequestError('Invalid login method.');
		}

		const passwordMatches = await compareHash(password, user.password);

		if (!passwordMatches) {
			throw new BadRequestError('Invalid credentials.');
		}

		const { id: userId, createdAt } = user;

		const token = generateToken({
			subject: userId,
			payload: { email, userId },
		});

		return ApiResponse.create(c, {
			token,
			user: { id: userId, email, createdAt },
		});
	}
);

authRouter.post(
	'/sign-up',
	zValidator(
		'json',
		z.object({
			email: z.string().email(),
			password: z.string().min(1).max(64),
		})
	),
	async c => {
		const { email, password } = c.req.valid('json');

		const user = await findUserByEmail(email);

		if (user && user.emailVerified) {
			throw new ConflictError(`Account already exists. ${user.password ? 'Please login.' : 'Try login method.'}`);
		}

		const hashedPassword = await hashString(password);
		const otp = await generateOtp();

		const userId = await insertUserWithVerification(
			{
				email,
				password: hashedPassword,
			},
			{
				otp: otp.hash,
				otpExpiration: otp.expiration,
			}
		);

		if (!userId) {
			throw new InternalError('Cannot sign up at the moment.');
		}

		const emailResponse = await sendEmail({
			to: email,
			emailType: EmailType.USER_VERIFICATION,
			props: { otp: otp.text },
		});

		if (emailResponse.error) {
			switch (emailResponse.error.name) {
				case 'not_found':
					throw new InternalError('Email not found. Please enter correct email.');
				default:
					throw new InternalError('Cannot send verification email at the moment.');
			}
		}

		const verificationToken = generateToken({
			subject: userId,
			payload: { email, userId },
			expiresIn: '5min',
		});

		return ApiResponse.create(c, {
			verificationToken,
			otpExpiration: otp.expiration,
		});
	}
);

authRouter.post(
	'/verify-email',
	zValidator(
		'json',
		z.object({
			verificationToken: z.string().min(1),
			otp: z.string().min(1).max(6),
		})
	),
	async c => {
		const { verificationToken, otp } = c.req.valid('json');

		const { email, userId } = verifyToken(verificationToken);

		const user = await findUserByEmail(email);
		const verificationDetails = await findUserVerificationDetails(userId);

		if (!verificationDetails || !user) {
			throw new ConflictError('Please sign up first.');
		}

		if (dateIsPast(verificationDetails.otpExpiration)) {
			throw new BadRequestError('OTP is expired.');
		}

		const otpMatches = await compareHash(otp, verificationDetails.otp);

		if (!otpMatches) {
			throw new BadRequestError('OTP is incorrect.');
		}

		try {
			await verifyUser(userId);
		} catch (error) {
			throw new InternalError('Cannot verify user at the moment.');
		}

		const token = generateToken({
			subject: userId,
			payload: { email, userId },
		});

		return ApiResponse.create(c, {
			token,
			user: { id: userId, email, createdAt: user.createdAt },
		});
	}
);

authRouter.post('/verification-code', zValidator('json', z.object({ email: z.string().email() })), async c => {
	const { email } = c.req.valid('json');

	const user = await findUserByEmail(email);

	if (!user) {
		throw new ConflictError('Please sign up first');
	}

	if (user.emailVerified) {
		throw new ConflictError(`Account already exists. ${user.password ? 'Please login.' : 'Try login method.'}`);
	}

	const otp = await generateOtp();

	const verification = await upsertUserVerification({
		userId: user.id,
		otp: otp.hash,
		otpExpiration: otp.expiration,
	});

	if (!verification) {
		throw new InternalError('Cannot send verification code at the moment');
	}

	const emailResponse = await sendEmail({
		to: email,
		emailType: EmailType.USER_VERIFICATION,
		props: { otp: otp.text },
	});

	if (emailResponse.error) {
		switch (emailResponse.error.name) {
			case 'not_found':
				throw new InternalError('Email not found. Please enter correct email.');
			default:
				throw new InternalError('Cannot send verification email at the moment.');
		}
	}

	const verificationToken = generateToken({
		subject: user.id,
		payload: { email, userId: user.id },
		expiresIn: '5min',
	});

	return ApiResponse.create(c, {
		verificationToken,
		otpExpiration: otp.expiration,
	});
});

export default authRouter;
