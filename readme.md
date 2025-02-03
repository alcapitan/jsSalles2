# Salles libres

![NodeJS](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white) 
![NPM](https://img.shields.io/badge/NPM-%23CB3837.svg?style=for-the-badge&logo=npm&logoColor=white)
![Express.js](https://img.shields.io/badge/express.js-%23404d59.svg?style=for-the-badge&logo=express&logoColor=%2361DAFB)
![EJS](https://img.shields.io/badge/ejs-%23B4CA65.svg?style=for-the-badge&logo=ejs&logoColor=black)
![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)

## Description

jsSalles est une application web permettant de trouver des salles libres dans l'université d'avignon (centre, ceri et agroscience).

## Fonctionnalités

- Voir les salles libres a l'heure actuelle et quand est ce qu'elle seront occupé.
- Voir les salles occupés et quand est ce qu'elle seront libre.
- Changer la date et l'heure pour planifier.

## Installation

### Prérequis

- Node.js (version 14 ou supérieure)
- NPM (version 6 ou supérieure)
- PostgreSQL

### Étapes d'installation

1. Clonez le dépôt :
    ```sh
    git clone https://github.com/votre-utilisateur/salles-libres.git
    cd salles-libres
    ```

2. Installez les dépendances :
    ```sh
    npm install
    ```

3. Configurez les variables d'environnement :
    Créez un fichier `.env` à la racine du projet et ajoutez les variables suivantes :
    ```env
    DB_USER=your_database_user
    DB_HOST=your_database_host
    DB_NAME=your_database_name
    DB_PASSWORD=your_database_password
    DB_PORT=your_database_port
    ```

4. Compilez les fichiers CSS :
    ```sh
    npm run css
    ```

5. Démarrez l'application :
    ```sh
    node index.js
    ```

6. Accédez à l'application dans votre navigateur à l'adresse `http://localhost:3001/salles`.

## Licence

Ce projet est sous licence MIT. Voir le fichier LICENSE pour plus de détails.
