const plugin = require("tailwindcss/plugin");
module.exports = {
  purge: [],
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {
      colors: {
        green: {
          150: "#c7edcc",
          light: "#4CAF50",
          dark: "#45a049",
          viridity:"#76ff03"
        },
        blue: {
          gray: "#607d8b",
        },
      },
    },
  },
  variants: {
    extend: {
      backgroundColor: ["prior"],
      inset:["prior"],
      textColor:["prior"],
      cursor:["prior"],
      margin: ["first"],
    },
  },
  plugins: [
    plugin(function ({ addVariant, e }) {
      addVariant("prior", ({ modifySelectors, separator }) => {
        modifySelectors(({ className }) => {
          return `:root .${e(`prior${separator}${className}`)}`;
        });
      });
    }),
  ],
};
