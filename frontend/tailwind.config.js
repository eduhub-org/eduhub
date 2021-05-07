module.exports = {
  darkMode: false, // or 'media' or 'class'
  mode: "jit",
  plugins: [],
  purge: ["./pages/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        "edu-black": "#222222",
      },
    },
  },
  variants: {
    extend: {},
  },
};
