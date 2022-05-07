FROM node
RUN mkdir -p /home/app
COPY . /home/app
WORKDIR /home/app
RUN npm install
RUN npm install react-scripts@3.4.1 -g

CMD ["npm", "start"]
