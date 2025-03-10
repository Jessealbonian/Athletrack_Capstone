/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{html,ts}',
  ],
  theme: {
    extend: {
      animation: {
        ping: 'ping 1s cubic-bezier(0, 0, 0.2, 1) ',
      },
    },
  },
  plugins: [],
}