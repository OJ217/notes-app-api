export interface ResetPasswordProps {
	otp: string;
}

export default function ResetPassword({ otp }: ResetPasswordProps) {
	return (
		<div>
			<h1>Dear User,</h1>
			<h3>Here is your verification code to reset your password: {otp}</h3>
		</div>
	);
}
