import { JSX } from 'react';
import { Resend } from 'resend';

import ResetPassword, { ResetPasswordProps } from '@/assets/reset-password';
import VerifyEmail, { VerifyEmailProps } from '@/assets/verify-email';
import { EmailType } from '@/types';

const resend = new Resend(process.env.RESEND_API_KEY);

type EmailTemplatesProps = {
	user_verification: VerifyEmailProps;
	reset_password: ResetPasswordProps;
};

const emailOptions: Record<EmailType, { subject: string; template: (props: any) => JSX.Element }> = {
	user_verification: {
		subject: 'Verify your email',
		template: VerifyEmail,
	},
	reset_password: {
		subject: 'Reset your password',
		template: ResetPassword,
	},
};

export const sendEmail = async <T extends EmailType>({ to, emailType, props }: { to: string; emailType: T; props: EmailTemplatesProps[T] }) => {
	const { template, subject } = emailOptions[emailType];

	return await resend.emails.send({
		to,
		from: `Notes App <${process.env.RESEND_EMAIL_ADDRESS}>`,
		subject: subject,
		react: template(props),
	});
};
