FROM node:22.9-slim
WORKDIR /app
COPY . /app
RUN npm install
EXPOSE 3000
ENV TZ = 'Europe/Paris'
CMD ["env", "TZ='Europe/Paris", "node","."]

