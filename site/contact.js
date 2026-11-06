// The public support email (G10). `APP_IDENTITY.supportEmail` in the app holds the same address.
const supportEmail = 'jinjinstar3@gmail.com';
if (supportEmail) {
  document.querySelectorAll('[data-contact]').forEach((line) => {
    // Japanese pages use a full-width colon.
    const label = line.textContent.match(/^[^:：]*[:：]\s*/)[0];
    const link = document.createElement('a');
    link.href = `mailto:${supportEmail}`;
    link.textContent = supportEmail;
    line.replaceChildren(label, link);
  });
}
