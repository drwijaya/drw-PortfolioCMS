# Contact form email setup

The site's public contact address and form recipient are `davidrwijaya@gmail.com`. Until SMTP is configured, the Contact page shows a direct email link instead of a form that cannot deliver.

1. Create or sign in to a [Resend](https://resend.com/) account.
2. In **Domains**, add `davidrwijaya.site`. Follow Resend's DNS instructions for **sending** and wait until the domain shows verified. If Resend offers the Cloudflare connection, it can add the required records for you. Keep any existing website and incoming-mail DNS records intact.
3. In **API Keys**, create a key named `Portfolio contact form` with **Sending access**, restricted to `davidrwijaya.site` if the option is available. Copy the key once and store it privately.
4. In the deployment environment, set the values below, replacing only `<RESEND_API_KEY>` with the key you created. For a local Compose deployment, use `web/.env`. Do not put the key in chat or commit it to Git.

   ```dotenv
   SMTP_HOST=smtp.resend.com
   SMTP_PORT=465
   SMTP_USER=resend
   SMTP_PASS=<RESEND_API_KEY>
   CONTACT_FROM=hello@davidrwijaya.site
   CONTACT_TO=davidrwijaya@gmail.com
   ```

5. Restart the `portfolio` service so it receives the new environment variables. The Contact page will then show the form. Submit one message and check the Gmail inbox and spam folder. The visitor's address is set as **Reply-To**, so replying to the notification responds to them.

The password field uses a Resend API key, not your Gmail password. Gmail only receives the messages; `hello@davidrwijaya.site` is the verified sender identity.
