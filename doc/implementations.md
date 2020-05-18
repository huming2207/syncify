# Implementation

In this chapter, the implementation details will be discussed.

## Project overview 

![assets/structure.png](assets/structure.png)

In general, project make uses of these technical stacks

- Backend API Server
    - Node.js
    - TypeScript
    - Fastify (web framework)
        - fastify-multipart
        - fastify-form
        - fastify-swagger and fastify-oas for Swagger UI + OAS 3.0 feed
    - JWT
    - Argon2 (for password hash)
    - MongoDB 
    - Mongoose (MongoDB ODM)
    - MinIO.js (S3 client)
- Frontend
    - Vue.js 2
    - Vuetify (UI framework)
    - Axios (XHR wrapper)
    - Luxon (time parsing)
    - Dropzone.js (file uploader)
- Deployment
    - Docker
    - Traefik (reverse proxy, Let's Encrypt ACME)

As it mentioned above, this project does not have any Server-side Rendering. Instead, the web UI is a completely separated project apart from the backend API server. The benefits include:

- Saving bandwidth and compute power on the server
- Easier to cache/compress frontend content on CDN
- More flexible 
    - Helps de-coupling
    - Reduce codebase complexity
    - Allows multiple client apps (e.g. Qt-based desktop app, CLI app...)
- Maximising the efficiency on development

## Backend (API Server)

The backend API server is written in Node.js, with TypeScript, Fastify and MongoDB. In this project, we have chosen Mongoose as our Object-Document Mapper. 

### Data structure

This diagram below shows the relationship between the MongoDB documents:

![assets/database.png](assets/database.png)

In the diagram, `FileDoc` is the file metadata document. It stores the file's info with a `storageId` mapped to the actual file in the object storage. The `hash` field in the `FileDoc` is reserved for implicit sync purposes in the future. It will be explained later.

The `PathDoc` is the directory tree's node. Directories in this project are stored in a multi-node tree structure. In each directory node, it has one parent and multiple children. There are two ways of traversing or searching the directory tree. For now it is done by brute force, where the user's root directory is populated first, and compare the directory name one-by-one. Apparently, this is not the best approach. There is a new bottom-up way to do so, which starts from the botto to run `findOne()` query with specifying the user ID and directory name, and then compare its parent. For instance, if there is a user ID given with a known path string `/cloud_comp/slides/assets/foo/bar`, the program will do these following steps:

1. Do a `findOne()` with specifying the user ID and directory name `bar`
2. If there is only one document returned, then it must be the directory the user want.
3. If more than one documents are returned, then it should perform **Step 1** for all their parents.
4. Take a record of the directories found.
5. Continue to try **Step 3 and 4** until only one `PathDoc` is returned.

For the `UserDoc`, it records each user's info. The `password` field is a Argon2 hash. Argon2 is an award-winning password hashing algorithm that would against GPU and ASIC password cracking. The `rootPath` field is the root path for that user. On every query, there is a pre-hook function to populate the `rootPath` field.

### API design

This project make uses of the JSON Schema support from Ajv and Fastify. All the requests and responses in this project have their own JSON Schemas. Then with the help from Ajv and fastify-oas plugin, validations and API documentation are done at one stroke. That means, the JSON Schema can be used for both generating API documentations and display it on Swagger UI, plus handling the validations. It also saves a lot of efforts on debugging.

Here are some screenshots for the Swagger UI. The Swagger UI is accessible at `/api/documentation`.

![assets/swagger.png](assets/swagger-overview.png)

![assets/swagger-detail.png](assets/swagger.png)

As a reference, here is a section of the JSON Schema for the request on `/api/auth/login` endpoint:

![assets/login-schema.png](assets/login-schema.png)

Furthermore, this project uses human-readable path string instead of machine-generated ID in the API request. For example, listing a directories can be done by sending GET request to `/api/path?path=/foo/bar`.

## Frontend (web app)

Initially, this project has chosen React with Material UI as the frontend technical stack, However due to the previous teaming issue, it has been changed to Vue 2 with Vuetify.

Here are some screenshots for the web app:

Register page:

![assets/register.png](assets/register.png)

Login page:

![assets/login.png](assets/login.png)

File upload:

![assets/file-upload.png](assets/file-upload.png)

File move:

![assets/move.png](assets/move.png)

Create new directory:

![assets/newdir.png](assets/newdir.png)

The web app consists of five views and three components. The five views are:

- Login
- Register
- File browser
- About page
- User portal

These five views are linked together by Vue-Router. The Login, Register, About and User Portal view are implemented with lazy-loading. To some extent, this design will increase the page loading time, and therefore the user experience will be improved.

In this screenshot below, those four views have been taken out to separated JavaScript files:

![lazy-loading](assets/vue-build.png)

## Server deployment

This project is deployed to AWS EC2. It is designed to be eazy, clean and flexible on the deployment. The web app and API server are wrapped into two separated Docker images. 

For the web app's Docker image, it is implemented with multi-stage build strategy. The first stage is a Node.js image for building and packing the web app, and the second stage is a Nginx image for serving the pre-built web app resources.

For the API Server's Docker image, it is relatively simpler. It is just a standard Node.js backend server production build process.

Meanwhile, a separated docker-compose configuration is also implemented. This configuration includes MongoDB (latest), the Syncify API server and the Syncify web app. Apart from that, there is another Traefik container included. Traefik is not only responsible for binding the API server and web app together, but also handles Let's Encrypt ACME challenges. 

## Further planning

Due to the previous teaming issue, some of the low-priority tasks are not implemented. It may be implemented in the near future. 

### Full-text search

MongoDB has the built-in full text searching functionality. This can be used for seaching texts amongs a few PDF or Microsoft Word documents.

One of the major users for these functions can be Electronic Engineers or Embedded Software Engineers. Nowadays, most of those chip manufacturers will release their product datasheet and reference manual in a few PDF documents. Therefore, they need to read a lot of these PDF documents every day and it is very time consuming. With this full text search function, if a Embedded software developer wants to find a characteristic of a certain register in a certain microcontroller chip, he or she can just type in some texts he can still remember, and in the end locate the actual document.

### Smoke Signal mode

Ultimately, this project will become a hybird personal cloud. It can be in the normal file hosting mode, and it also be in the "smoke signal" mode.

In the "smoke signal" mode, the API server acts like a CDN and BitTorrent. 

For example, an international student from China, Tom, owns two Synology Network Attached Storage (NAS) servers. One is located in Shenzhen, China and the other one is in Melbourne, Australia. Due to the local ISP's restrictions in China, the NAS does not have public IP address.

Tom wants to backup and sync some files with his family in China. But since there is no public IP address, he cannot connect his NAS servers directly. He can deploy this project's API server to a VPS instance in Sydney, and then run the client apps on the NAS servers. When he adds the file in his NAS in Melbourne, the files will be encrypted using the credential generated based on his accont information, and upload to the VPS in Sydney. The newly uploaded files will be cached to object storage, and marked as hot or warm data. Meanwhile, the NAS in Shenzhen will download the file from the Sydney server.

After the file is synced, the data may be deleted from the object storage if no one access it. But the file metadata will be kept, which includes the file's hash. 

Later if Tom goes on a trip to New Zealand, he does not need to use VPN to access his files. Instead, he just need to login to the web portal and browse the directories based on the file metadata that previously generated. If he wants to get a file to his computer, the API server will request the NAS to re-upload the file, then redirect to him.

Moreover, more than one API servers are allowed. The file metadata will be synced in between, and some frequently accessed data will be cached.