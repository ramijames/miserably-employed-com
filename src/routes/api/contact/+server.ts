import { json, type RequestHandler } from '@sveltejs/kit';
import { Resend } from 'resend';
import { env } from '$env/dynamic/private';

export const POST: RequestHandler = async ({ request }) => {
	const apiKey = env.RESEND_API_KEY;
	if (!apiKey) {
		return json({ error: 'Email service not configured' }, { status: 500 });
	}

	let body: { name?: string; email?: string; message?: string };
	try {
		body = await request.json();
	} catch {
		return json({ error: 'Invalid request body' }, { status: 400 });
	}

	const name = body.name?.trim();
	const email = body.email?.trim();
	const message = body.message?.trim();

	if (!name || !email || !message) {
		return json({ error: 'Missing required fields' }, { status: 400 });
	}

	if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
		return json({ error: 'Invalid email address' }, { status: 400 });
	}

	const resend = new Resend(apiKey);

	const fromAddress = env.CONTACT_FROM_ADDRESS || 'onboarding@resend.dev';
	const toAddress = env.CONTACT_TO_ADDRESS || 'hello@miserablyemployed.com';

	const { error } = await resend.emails.send({
		from: `Miserably Employed <${fromAddress}>`,
		to: toAddress,
		replyTo: email,
		subject: `New contact form submission from ${name}`,
		text: `From: ${name} <${email}>\n\n${message}`
	});

	if (error) {
		return json({ error: 'Failed to send message' }, { status: 502 });
	}

	return json({ success: true });
};
