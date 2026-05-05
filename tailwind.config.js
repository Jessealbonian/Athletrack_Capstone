/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{html,ts}',
  ],
  safelist: ['lg:ml-64', 'lg:ml-20', 'lg:pl-5', 'pb-20', 'lg:pb-6'],
  theme: {
    extend: {
      animation: {
        ping: 'ping 1s cubic-bezier(0, 0, 0.2, 1) ',
      },
    },
  },
  plugins: [],
}