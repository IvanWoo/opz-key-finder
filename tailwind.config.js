module.exports = {
    future: {
        removeDeprecatedGapUtilities: true,
        purgeLayersByDefault: true,
    },
    purge: ["./public/**/*.html", "./src/**/*.{js,jsx,ts,tsx,vue}"],
    theme: {
        extend: {},
    },
    variants: { neumorphismInset: ["active"] },
    plugins: [require("tailwindcss-neumorphism")],
};
