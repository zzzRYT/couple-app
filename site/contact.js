// Set the approved public support email here after G10 is resolved.
const supportEmail = '';
if (supportEmail) {
  document.querySelectorAll('[data-contact]').forEach((line) => {
    const label = line.textContent.split(':')[0];
    const link = document.createElement('a');
    link.href = `mailto:${supportEmail}`;
    link.textContent = supportEmail;
    line.replaceChildren(`${label}: `, link);
  });
}
