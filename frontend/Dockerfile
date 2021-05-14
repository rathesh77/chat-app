FROM node:12

WORKDIR /app

COPY package*.json ./

RUN npm install
RUN npm install -D tailwindcss@npm:@tailwindcss/postcss7-compat postcss@^7 autoprefixer@^9

COPY . .

ENV PORT=8080

EXPOSE 8080

ENTRYPOINT ["npm", "run", "serve"]