FROM python:3.9-slim

WORKDIR /app
COPY . /app

RUN pip install -r requirements.txt

EXPOSE 8000

#gunicorn port 8000 cmd
CMD ["gunicorn", "-b", "0.0.0.0:8000", "main:app"]