# supply env to build time
ENV?=.env.development
-include $(ENV)
export

start:
	yarn start

build:
	yarn build
