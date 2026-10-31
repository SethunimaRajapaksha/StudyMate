// Format: IN24-S2-IT1207, IN23-S1-CH1102
const COURSE_CODE_REGEX = /^[A-Z]{2}\d{2}-S\d-[A-Z]{2,3}\d{4}$/;
const UNI_EMAIL_REGEX = /^[a-z0-9._+-]+@itum\.mrt\.ac\.lk$/i;
const UNI_EMAIL_DOMAIN = "@itum.mrt.ac.lk";

const normalizeCourseCode = (value) => String(value || "").trim().toUpperCase();

module.exports = {
  COURSE_CODE_REGEX,
  UNI_EMAIL_REGEX,
  UNI_EMAIL_DOMAIN,
  normalizeCourseCode,
};