export const SUPPORTED_CURRENCIES = [
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "CRC", symbol: "₡", name: "Costa Rican Colón" },
] as const;

export const DEFAULT_CURRENCY = "USD";

export const EXCHANGE_RATE_CACHE_HOURS = 6;

// BCCR "tipos de cambio de ventanilla" table (sdd.bccr.fi.cr, cuadro 1015).
// The old gee.bccr.fi.cr/.../frmConsultaTCVentanilla.aspx page was retired in Sept 2026.
const BCCR_SDDE_API = "https://apim.bccr.fi.cr/SDDE/api/Bccr.GE.SDDE.IndicadoresSitioExterno";
export const BCCR_CSRF_TOKEN_URL = `${BCCR_SDDE_API}.ServiciosUsuario.API/Token/GenereCSRF`;
export const BCCR_VENTANILLA_URL = `${BCCR_SDDE_API}.GrupoVariables.API/CuadroPersonalizadoGrupoVariables/ObtenerDatosCuadroPersonalizado`;
export const BCCR_VENTANILLA_GROUP_ID = 1015;
export const BCCR_TIME_ZONE = "America/Costa_Rica";
export const BCCR_BANK_NAME_PATTERN = /BAC San Jos/i;
