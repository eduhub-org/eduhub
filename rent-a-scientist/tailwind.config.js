module.exports = {
  darkMode: false, // or 'media' or 'class'
  mode: "jit",
  plugins: [],
  purge: ["./pages/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      gridTemplateColumns: {
        32: "repeat(32, minmax(0, 1fr))",
        24: "repeat(24, minmax(0, 1fr))",
      },
      colors: {
        "rsa-black": "#222222",
        "rsa-background": "green",
      },
    },
    fontFamily: {
      body: ['"Space Grotesk"', '"sans-serif"'],
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
