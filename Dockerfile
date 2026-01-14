# 1. 파이썬 3.11 이미지 사용
FROM python:3.11-slim

# 2. 컨테이너 내부 작업 디렉토리 설정
WORKDIR /app

# 3. 라이브러리 설치 파일 복사 및 설치
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 4. 소스 코드 전체 복사
COPY . .

# 5. FastAPI 실행 (8000번 포트 사용)
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]