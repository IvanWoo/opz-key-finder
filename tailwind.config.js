module.exports = {
    future: {
        removeDeprecatedGapUtilities: true,
        purgeLayersByDefault: true,
    },
    purge: ["./src/*.ts", "./src/**/*.ts", "./index.html"],
    theme: {
        extend: {},
    },
    variants: { neumorphismInset: ["active"] },
    plugins: [require("tailwindcss-neumorphism")],
};
