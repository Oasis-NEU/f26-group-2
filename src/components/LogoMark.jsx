// The Husky Exchange logo (also in public/logo.svg). Its dark "H" is made for
// light backgrounds, so on the dark theme it sits on a white tile (.logo__mark).
// Decorative: the link around it carries the name.
function LogoMark({ className }) {
  return (
    <svg className={className} viewBox="0 0 294 190" fill="none" aria-hidden="true" focusable="false">
      <path d="M168 0H292V38H204V68H168V0Z" fill="#C8102E" />
      <path d="M158 78H230V60L286 96L230 132V114H158V78Z" fill="#C8102E" />
      <path d="M168 122H204V152H294V190H168V122Z" fill="#C8102E" />
      <path d="M0 0H44V78H114V0H158V190H114V112H44V114L0 164V0Z" fill="#1C1F26" />
      <path
        d="M0 164V82C4 56 14 30 36 8L44 30L58 8C62 20 62 34 64 48C78 52 88 64 96 78L122 88L120 100L130 110C122 126 98 132 74 136C60 146 60 166 70 190H38C34 166 42 144 42 134L20 136L0 164Z"
        fill="#1C1F26"
      />
      <path d="M12 60C14 42 22 26 34 14L36 44C26 46 18 52 12 60Z" fill="#fff" />
      <path
        d="M10 112C10 96 20 88 36 84C38 66 46 56 60 56C74 56 84 68 90 80L120 92L118 102L124 108C118 120 100 126 76 128C58 128 50 138 44 154C38 166 36 178 38 190H0V164C12 148 18 130 16 108L10 112Z"
        fill="#fff"
      />
      <path d="M50 76C60 70 72 74 78 84C66 86 56 82 50 76Z" fill="#1C1F26" />
    </svg>
  )
}

export default LogoMark
