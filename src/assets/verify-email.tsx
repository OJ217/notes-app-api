export interface VerifyEmailProps {
	otp: string;
}

export default function VerifyEmail({ otp }: VerifyEmailProps) {
	return (
		<div>
			<h1>Welcome to Notes App,</h1>
			<h3>Your verification code is: {otp}</h3>
		</div>
	);
}
