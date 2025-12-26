# Jekyll 빠른 시작 가이드 (tl29435 계정)

tl29435 계정에서 다음 명령어들을 순서대로 실행하세요.

## 1. 환경 변수 설정 (한 번만)

```bash
export GEM_HOME="$HOME/gems"
export PATH="$HOME/gems/bin:$PATH"
```

이 설정을 영구적으로 하려면:
```bash
echo 'export GEM_HOME="$HOME/gems"' >> ~/.bashrc
echo 'export PATH="$HOME/gems/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

## 2. Bundler 설치 (한 번만)

```bash
gem install bundler
```

## 3. 프로젝트 디렉토리로 이동

```bash
cd /home/tl29435/academic-homepage
```

## 4. 의존성 설치

```bash
bundle install
```

## 5. Jekyll 서버 실행

```bash
bundle exec jekyll serve
```

서버가 시작되면 다음 메시지가 나타납니다:
```
Server address: http://127.0.0.1:4000/
```

## 6. 브라우저에서 확인

웹 브라우저를 열고 다음 주소로 접속:
- **http://localhost:4000** 또는 **http://127.0.0.1:4000**

## 서버 중지

터미널에서 `Ctrl + C`를 누르세요.

---

## 한 번에 실행 (복사해서 붙여넣기)

```bash
export GEM_HOME="$HOME/gems"
export PATH="$HOME/gems/bin:$PATH"
cd /home/tl29435/academic-homepage
bundle exec jekyll serve
```

(이미 bundler가 설치되어 있다면 위 명령어만 실행하면 됩니다)




