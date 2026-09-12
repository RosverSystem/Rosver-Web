/** Datos oficiales Rosver (SUNAT) para web, PDF y contacto. */
export const ROSVER_COMPANY = {
  legalName: 'ROSVER S.A.C.',
  tradeName: 'ROSVER',
  ruc: '20609530902',
  taxpayerType: 'SOCIEDAD ANONIMA CERRADA',
  /** Domicilio fiscal SUNAT (documentos / PDF) */
  address:
    'JR. CUSCO NRO. 774 INT. 101 URB. BARRIOS ALTOS LIMA - LIMA - LIMA',
  /** Dirección pública en web */
  localAddress: 'Jirón Cusco 774, Lima 15001',
  /** Enlace a Google Maps (abre app / pestaña) */
  mapsUrl:
    'https://www.google.com/maps/search/?api=1&query=Jir%C3%B3n%20Cusco%20774%2C%20Lima%2015001',
  /** Embed iframe (sin API key) */
  mapsEmbedUrl:
    'https://maps.google.com/maps?q=Jir%C3%B3n%20Cusco%20774%2C%20Lima%2015001&z=16&hl=es&output=embed',
  registeredAt: '26/05/2022',
  activitiesStartedAt: '01/06/2022',
  phones: '980 202 591 / 960 106 901',
  email: 'ventas@rosver.pe',
  web: 'https://rosver-web-production.up.railway.app',
} as const
