module.exports = {
    content: ["./index.html", "./src/**/*.{vue,js,ts,jsx,tsx}"],
    theme: {
        extend: {},
    },
    variants: { neumorphismInset: ["active"] },
    plugins: [require("tailwindcss-neumorphism")],
};
