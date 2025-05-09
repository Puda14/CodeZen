LANGUAGES = python gcc golang node openjdk pascal ruby sharp

all: $(LANGUAGES)

$(LANGUAGES):
	docker build -f app/docker/Dockerfile.$@ -t codezen/$@ .
	docker tag codezen/$@ puda14/codezen-$@:latest
	docker push puda14/codezen-$@:latest
	@echo "✅ Done $@"

.PHONY: all $(LANGUAGES)
