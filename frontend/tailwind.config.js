module.exports = {
  darkMode: false, // or 'media' or 'class'
  mode: "jit",
  plugins: [],
  purge: ["./pages/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        "edu-black": "#222222",
        "edu-green": "#00A398",
        "edu-missed-yellow": "#F2991D66",
      },
    },
    fontFamily: {
      body: ["Space Grotesk", "sans-serif"],
    },
    listStyleType: {
      check: "{ list-style-image: url(img/iphone.png); }",
    },
    minWidth: {
      menu: "225px",
    },
  },
  variants: {
    extend: {},
  },
};
