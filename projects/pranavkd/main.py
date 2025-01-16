from flask import Flask

app = Flask(__name__)

counter = 0

@app.route('/')
def hello_world():
    global counter
    counter += 1
    print(f'Hello, World! {counter}')
    return f'Hello, World!! {counter}'

if __name__ == '__main__':
    app.run()