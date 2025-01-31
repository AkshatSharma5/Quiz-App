/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
  	extend: {
  		backgroundImage: {
  			'gradient-quiz': 'linear-gradient(to right, #a5b4fc 10%, #bae6fd 30%, #a7f3d0 90%)'
  		},
  		animation: {
  			'pulse-heart': 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite'
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		fontFamily: {
  			bioRhyme: [
  				'BioRhyme',
  				'serif'
  			],
  			josefinSans: [
  				'Josefin Sans',
  				'sans-serif'
  			],
  			oswald: [
  				'Oswald',
  				'sans-serif'
  			],
  			playfair: [
  				'Playfair Display',
  				'serif'
  			],
  			poppins: [
  				'Poppins',
  				'sans-serif'
  			],
  			spaceGrotesk: [
  				'Space Grotesk',
  				'sans-serif'
  			]
  		},
  		colors: {}
  	}
  },
  plugins: [require("tailwindcss-animate")],
};
