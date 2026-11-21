from app.database import Base, engine, SessionLocal
from app.models import Inspection

Base.metadata.create_all(bind=engine)
db = SessionLocal()
try:
    if db.query(Inspection).count() == 0:
        db.add_all([
            Inspection(site_name="North Warehouse", inspector="Asha", status="pending",
                       notes="Check fire exits and emergency lights.", version=1),
            Inspection(site_name="Central Office", inspector="Rahul", status="in_progress",
                       notes="Inspect electrical panels.", version=1),
            Inspection(site_name="South Depot", inspector="Meera", status="completed",
                       notes="Routine safety inspection completed.", version=1),
        ])
        db.commit()
        print("Inserted 3 sample inspections.")
    else:
        print("Database already contains inspections; seed skipped.")
finally:
    db.close()
