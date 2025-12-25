# tl29435 계정으로 Jekyll 실행하기

lab-admin 계정에서 tl29435로 전환한 후 다음 명령어들을 실행하세요.

## 전체 과정 (한 번에 복사해서 실행)

```bash
su - tl29435
export GEM_HOME="$HOME/gems"
export PATH="$HOME/gems/bin:$PATH"
cd /home/tl29435/academic-homepage
bundle install
bundle exec jekyll serve
```

## 단계별 실행

### 1. tl29435 계정으로 전환
```bash
su - tl29435
```
(tl29435 비밀번호 입력 필요)

### 2. 환경 변수 설정
```bash
export GEM_HOME="$HOME/gems"
export PATH="$HOME/gems/bin:$PATH"
```

### 3. Bundler 설치 (아직 설치되지 않았다면)
```bash
gem install bundler
```

### 4. 프로젝트 디렉토리로 이동
```bash
cd /home/tl29435/academic-homepage
```

### 5. 의존성 설치
```bash
bundle install
```

### 6. Jekyll 서버 실행
```bash
bundle exec jekyll serve
```

서버가 시작되면:
```
Server address: http://127.0.0.1:4000/
```

### 7. 브라우저에서 확인
- **http://localhost:4000** 또는 **http://127.0.0.1:4000**

## 서버 중지
터미널에서 `Ctrl + C`를 누르세요.

## 환경 변수를 영구적으로 설정하려면

tl29435 계정에서:
```bash
echo 'export GEM_HOME="$HOME/gems"' >> ~/.bashrc
echo 'export PATH="$HOME/gems/bin:$PATH"' >> ~/.bashrc
```

다음 번에는 `su - tl29435`만 하면 환경 변수가 자동으로 설정됩니다.

