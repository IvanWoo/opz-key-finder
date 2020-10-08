module.exports = {
    future: {
        removeDeprecatedGapUtilities: true,
        purgeLayersByDefault: true,
    },
    theme: {
        extend: {},
    },
    variants: { neumorphismInset: ["responsive", "hover", "focus", "active"] },
    plugins: [require("tailwindcss-neumorphism")],
};
