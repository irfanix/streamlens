.PHONY: dev test build run seed clean

dev:
	@echo "Backend: cd backend && uvicorn app.main:app --reload --port 8000"
	@echo "Frontend: cd frontend && npm run dev"

run:
	cd backend && uvicorn app.main:app --host 0.0.0.0 --port 7860

test:
	cd backend && python -m pytest -q

build:
	cd frontend && npm install && npm run build
	docker build -t streamlens:latest .

seed:
	cd backend && python -m scripts.seed_demo

clean:
	rm -rf frontend/dist frontend/node_modules backend/data backend/.pytest_cache
	find backend -name "__pycache__" -type d -prune -exec rm -rf {} +
