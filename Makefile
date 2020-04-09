# supply env to build time
ENV?=.env
-include $(ENV)
export

build:
	yarn build
