import swaggerJSDoc from 'swagger-jsdoc';
import { env } from './env.js';

const swaggerOptions: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Aresta API',
      version: '1.0.0',
      description: 'Documentação da API REST do Aresta Backend (Node.js, Express, Prisma, MVC)',
      contact: {
        name: 'Aresta Team',
        email: 'contato@aresta.org',
      },
    },
    servers: [
      {
        url: `http://localhost:${env.PORT}`,
        description: 'Servidor Local',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Insira o token JWT no formato: Bearer {token}',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/controllers/*.ts', './src/routes/*.ts'],
};

export const swaggerSpec = swaggerJSDoc(swaggerOptions);

