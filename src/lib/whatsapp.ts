export const normalizePhoneForWhatsAppLink = (value: string) =>
  value.replace(/[^\d]/g, "");

export const buildProductAvailabilityWhatsAppLink = (
  whatsappNumber: string,
  productName: string,
) => {
  const phone = normalizePhoneForWhatsAppLink(whatsappNumber);
  const message = encodeURIComponent(
    `Hola, quiero consultar la próxima disponibilidad de ${productName}.`,
  );

  return `https://wa.me/${phone}?text=${message}`;
};
