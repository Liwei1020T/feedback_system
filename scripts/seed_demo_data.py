#!/usr/bin/env python3
"""
Demo Data Seeding Script for Feedback Management System

This script creates comprehensive demo data including:
- Users across different roles, departments, and plants
- Realistic complaints and feedback with various statuses
- Replies, internal notes, and attachments
- Audit logs and notifications
"""

import sys
from pathlib import Path
from datetime import datetime, timedelta
from random import randint, choice, uniform

# Add the app directory to the path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.datastore import InMemoryDB
from app.models import (
    ComplaintKind, Priority, ComplaintStatus, Role
)
from app.core.config import settings


def seed_demo_data():
    """Populate database with comprehensive demo data."""
    print("Starting demo data seeding...")

    db = InMemoryDB()

    # Clear existing data (except default categories)
    print("Clearing existing data...")

    # Create additional users beyond the defaults
    print("Creating demo users...")
    demo_users = create_demo_users(db)

    # Create diverse complaints and feedback
    print("Creating demo complaints and feedback...")
    demo_complaints = create_demo_complaints(db, demo_users)

    # Add replies to some complaints
    print("Adding replies to complaints...")
    add_demo_replies(db, demo_complaints, demo_users)

    # Add internal notes
    print("Adding internal notes...")
    add_demo_internal_notes(db, demo_complaints, demo_users)

    # Add notifications
    print("Creating notifications...")
    create_demo_notifications(db, demo_users)

    print(f"Demo data seeding complete!")
    print(f"   - Users: {len(db.users)}")
    print(f"   - Complaints: {len(db.complaints)}")
    print(f"   - Replies: {len(db.replies)}")
    print(f"   - Categories: {len(db.categories)}")


def create_demo_users(db):
    """Create diverse demo users."""
    demo_users = []

    # Additional employees for different plants and departments
    employees = [
        # IT Department
        {"username": "john.tan", "email": "john.tan@example.com", "role": Role.employee, "department": "IT", "plant": "P1"},
        {"username": "sarah.wong", "email": "sarah.wong@example.com", "role": Role.employee, "department": "IT", "plant": "P2"},
        # HR Department
        {"username": "hr_manager", "email": "hr.manager@example.com", "role": Role.admin, "department": "HR", "plant": "P1", "password": "temps3cret"},
        {"username": "hr_assistant", "email": "hr.assistant@example.com", "role": Role.employee, "department": "HR", "plant": "P1"},
        # Payroll Department
        {"username": "payroll_staff", "email": "payroll.staff@example.com", "role": Role.employee, "department": "Payroll", "plant": "P2"},
        # Facilities Department
        {"username": "facilities_tech", "email": "facilities.tech@example.com", "role": Role.employee, "department": "Facilities", "plant": "BK"},
        # Safety Department
        {"username": "safety_officer", "email": "safety.officer@example.com", "role": Role.admin, "department": "Safety", "plant": "P1", "password": "temps3cret"},
        # Regular employees
        {"username": "employee1", "email": "emp1@example.com", "role": Role.employee, "department": None, "plant": "P1"},
        {"username": "employee2", "email": "emp2@example.com", "role": Role.employee, "department": None, "plant": "P2"},
        {"username": "employee3", "email": "emp3@example.com", "role": Role.employee, "department": None, "plant": "BK"},
    ]

    for user_data in employees:
        password = user_data.pop("password", "demo123")
        user = db.create_user(
            username=user_data["username"],
            email=user_data["email"],
            password=password,
            role=user_data["role"],
            department=user_data.get("department"),
            plant=user_data.get("plant"),
        )
        demo_users.append(user)
        print(f"   Created user: {user.username} ({user.role})")

    return demo_users


def create_demo_complaints(db, demo_users):
    """Create diverse complaints with realistic data."""

    # Sample complaint templates
    complaint_templates = [
        # IT Issues
        {
            "category": "IT",
            "complaints": [
                "My laptop screen flickers constantly, making it difficult to work. This has been happening for the past week.",
                "Cannot access the internal portal. Getting 'Access Denied' error when trying to log in.",
                "Printer on Floor 3 is constantly jamming. We've wasted a lot of paper trying to print important documents.",
                "Microsoft Teams keeps crashing during video calls. Very disruptive for client meetings.",
                "Need software license renewal for Adobe Creative Suite. Current license expires next week.",
                "Internet connection is very slow in the east wing. Pages take forever to load.",
                "My computer won't connect to the network drive. Can't access shared files for my project.",
                "Email server is down. Not receiving any emails since morning.",
            ],
        },
        # HR Issues
        {
            "category": "HR",
            "complaints": [
                "Haven't received my employee handbook yet. Been here for 3 weeks already.",
                "Need clarification on the work-from-home policy. Manager gave different information than HR.",
                "Submitted leave application 2 weeks ago but still haven't received approval.",
                "Want to know about the health insurance benefits. The information packet is confusing.",
                "Experiencing workplace harassment from a colleague. Need urgent assistance.",
                "Performance review was supposed to be last month but hasn't been scheduled yet.",
                "Need help with visa renewal process. Current visa expires in 2 months.",
            ],
        },
        # Payroll Issues
        {
            "category": "Payroll",
            "complaints": [
                "Last month's overtime hours are not reflected in my payslip.",
                "EPF deduction amount seems incorrect. Please verify the calculation.",
                "Travel reimbursement from client visit hasn't been processed yet. Submitted 3 weeks ago.",
                "Bonus amount mentioned in my contract is different from what I received.",
                "Need tax clearance letter for bank loan application. How do I request this?",
                "Salary was deposited 3 days late this month. This caused issues with my auto-payments.",
            ],
        },
        # Facilities Issues
        {
            "category": "Facilities",
            "complaints": [
                "Air conditioning in Conference Room B is not working. Room gets very hot during meetings.",
                "Parking lot lighting is insufficient. Very dark and unsafe in the evenings.",
                "Toilet on Floor 5 has been out of order for 2 days now.",
                "Need additional chairs for the training room. We have a workshop next week for 30 people.",
                "Water cooler in pantry is broken. No cold water available.",
                "Elevator is making strange noises. Feels unsafe to use.",
                "Recycling bins haven't been emptied for over a week. Starting to smell bad.",
            ],
            "feedback": [
                "Thank you for quickly fixing the broken door lock. Much appreciated!",
                "The new furniture in the lounge area is fantastic. Much more comfortable now.",
                "Great job maintaining the garden area. It looks beautiful!",
            ],
        },
        # Safety Issues
        {
            "category": "Safety",
            "complaints": [
                "Fire extinguisher on Floor 2 needs refilling. Tag shows it's overdue for inspection.",
                "Emergency exit sign is not illuminated. Needs immediate attention.",
                "First aid kit in the workshop is missing bandages and antiseptic.",
                "Floor in the warehouse is wet and slippery. Someone could get hurt.",
                "Electrical outlet is sparking. Very dangerous situation.",
                "No safety goggles available in the lab. This is a serious safety hazard.",
            ],
        },
    ]

    created_complaints = []
    admin_users = [u for u in db.list_users() if u.role in [Role.admin, Role.super_admin]]

    # Generate complaints over the last 30 days
    for template in complaint_templates:
        category = template["category"]
        complaints = template.get("complaints", [])
        feedback_list = template.get("feedback", [])

        # Create complaints
        for complaint_text in complaints:
            hours_ago = randint(1, 720)  # Random time within last 30 days
            created_at = datetime.utcnow() - timedelta(hours=hours_ago)

            # Determine status based on age
            if hours_ago < 24:
                status = ComplaintStatus.pending
            elif hours_ago < 72:
                status = choice([ComplaintStatus.pending, ComplaintStatus.in_progress])
            elif hours_ago < 168:
                status = choice([ComplaintStatus.in_progress, ComplaintStatus.resolved])
            else:
                status = choice([ComplaintStatus.resolved, ComplaintStatus.in_progress])

            # Determine priority based on keywords
            urgent_keywords = ["urgent", "emergency", "unsafe", "dangerous", "critical", "harassment"]
            priority = Priority.urgent if any(word in complaint_text.lower() for word in urgent_keywords) else Priority.normal

            # Random employee ID and contact
            emp_id = f"EMP{randint(1000, 9999)}"
            plant = choice(["P1", "P2", "BK"])

            complaint = db.create_complaint(
                emp_id=emp_id,
                email=f"{emp_id.lower()}@example.com",
                phone=f"+6012345{randint(1000, 9999)}",
                complaint_text=complaint_text,
                plant=plant,
                kind=ComplaintKind.complaint,
                category=category,
                priority=priority,
            )

            # Update with AI confidence and status
            db.update_complaint(
                complaint.id,
                status=status,
                ai_confidence=round(uniform(0.75, 0.95), 2),
                kind_confidence=round(uniform(0.70, 0.92), 2),
            )

            # Update timestamps
            existing = db.complaints[complaint.id]
            db.complaints[complaint.id] = existing.model_copy(
                update={"created_at": created_at, "updated_at": created_at}
            )

            # Assign to appropriate admin
            category_admins = [u for u in admin_users if u.department == category]
            if category_admins:
                assigned_admin = choice(category_admins)
                db.update_complaint(complaint.id, assigned_to=assigned_admin.id)

            created_complaints.append(complaint)

        # Create positive feedback
        for feedback_text in feedback_list:
            hours_ago = randint(1, 360)
            created_at = datetime.utcnow() - timedelta(hours=hours_ago)

            emp_id = f"EMP{randint(1000, 9999)}"
            plant = choice(["P1", "P2", "BK"])

            complaint = db.create_complaint(
                emp_id=emp_id,
                email=f"{emp_id.lower()}@example.com",
                phone=f"+6012345{randint(1000, 9999)}",
                complaint_text=feedback_text,
                plant=plant,
                kind=ComplaintKind.feedback,
                category=category,
                priority=Priority.normal,
            )

            db.update_complaint(
                complaint.id,
                status=ComplaintStatus.resolved,
                ai_confidence=round(uniform(0.80, 0.95), 2),
                kind_confidence=round(uniform(0.85, 0.95), 2),
            )

            existing = db.complaints[complaint.id]
            db.complaints[complaint.id] = existing.model_copy(
                update={"created_at": created_at, "updated_at": created_at}
            )

            created_complaints.append(complaint)

    print(f"   Created {len(created_complaints)} complaints and feedback")
    return created_complaints


def add_demo_replies(db, complaints, users):
    """Add replies to resolved and in-progress complaints."""
    admin_users = [u for u in db.list_users() if u.role in [Role.admin, Role.super_admin]]

    reply_templates = {
        "IT": [
            "We've received your IT request and assigned it to our technical team. They will contact you within 24 hours.",
            "Our IT specialist has resolved the issue. Please verify and let us know if you experience any further problems.",
            "We've escalated this to our senior technician. They will reach out to you directly to schedule a visit.",
            "This issue has been fixed. Please restart your device and check if everything is working properly.",
        ],
        "HR": [
            "Thank you for contacting HR. We're reviewing your request and will get back to you within 48 hours.",
            "We've scheduled a meeting to discuss this matter. Please check your email for the appointment details.",
            "Your request has been approved. Documentation will be sent to you via email.",
            "We've reviewed your case and forwarded it to the relevant department for further action.",
        ],
        "Payroll": [
            "Our payroll team has reviewed your records and found the discrepancy. The correction will be reflected in your next payslip.",
            "Your reimbursement request has been approved and will be processed in the next payment cycle.",
            "We've verified the calculation and it appears to be correct. Please check the attached breakdown for details.",
            "Thank you for bringing this to our attention. The issue has been resolved and you should see the adjustment shortly.",
        ],
        "Facilities": [
            "Our facilities team has been notified and will address this issue within 24 hours.",
            "We've scheduled maintenance for this item. Work will be completed by end of week.",
            "Thank you for reporting this. The issue has been resolved.",
            "This has been added to our maintenance schedule. We appreciate your patience.",
        ],
        "Safety": [
            "Safety is our top priority. We've dispatched our safety officer to investigate immediately.",
            "Thank you for reporting this safety concern. It has been addressed and resolved.",
            "We've inspected the area and taken corrective action. The situation is now safe.",
            "Your safety report has been logged and the necessary repairs have been completed.",
        ],
    }

    reply_count = 0
    for complaint in complaints:
        # Only add replies to in-progress or resolved complaints
        if complaint.status not in [ComplaintStatus.in_progress, ComplaintStatus.resolved]:
            continue

        # 70% chance to add a reply
        if randint(1, 10) <= 7:
            category_templates = reply_templates.get(complaint.category, [])
            if not category_templates:
                continue

            reply_text = choice(category_templates)

            # Find appropriate admin
            admin = None
            if complaint.assigned_to:
                admin = db.get_user(complaint.assigned_to)
            else:
                category_admins = [u for u in admin_users if u.department == complaint.category]
                if category_admins:
                    admin = choice(category_admins)

            if not admin:
                admin = choice(admin_users)

            # Create reply timestamp between complaint creation and now
            complaint_age = datetime.utcnow() - complaint.created_at
            reply_delay = timedelta(hours=randint(1, int(complaint_age.total_seconds() // 3600)))
            reply_time = complaint.created_at + reply_delay

            reply = db.create_reply(
                complaint_id=complaint.id,
                admin_id=admin.id,
                reply_text=reply_text,
                email_sent=True,
                email_sent_at=reply_time,
            )

            # Update reply timestamp
            db.replies[reply.id] = db.replies[reply.id].model_copy(
                update={"created_at": reply_time}
            )

            reply_count += 1

    print(f"   Created {reply_count} replies")


def add_demo_internal_notes(db, complaints, users):
    """Add internal notes to some complaints."""
    admin_users = [u for u in db.list_users() if u.role in [Role.admin, Role.super_admin]]

    note_templates = [
        "Following up with the user tomorrow.",
        "Escalated to senior team for review.",
        "Waiting for parts to arrive before we can proceed.",
        "User confirmed the issue is resolved.",
        "Need to coordinate with facilities team on this.",
        "Similar issue reported last week - may be related.",
        "Scheduled on-site visit for next Tuesday.",
        "Requires approval from management before proceeding.",
    ]

    note_count = 0
    for complaint in complaints:
        # 30% chance to add internal notes
        if randint(1, 10) <= 3:
            num_notes = randint(1, 2)
            for _ in range(num_notes):
                admin = choice(admin_users)
                note_text = choice(note_templates)

                # Create note between complaint creation and now
                complaint_age = datetime.utcnow() - complaint.created_at
                note_delay = timedelta(hours=randint(1, int(complaint_age.total_seconds() // 3600)))
                note_time = complaint.created_at + note_delay

                # Add to internal notes list
                from app.models import InternalNote
                note = InternalNote(
                    id=db._next_id("internal_note"),
                    complaint_id=complaint.id,
                    author_id=admin.id,
                    author_name=admin.username,
                    content=note_text,
                    mentions=[],
                    is_pinned=False,
                    attachments=[],
                    created_at=note_time,
                    updated_at=note_time,
                )

                # Update complaint with the note
                existing = db.complaints[complaint.id]
                internal_notes = existing.internal_notes.copy()
                internal_notes.append(note)
                db.complaints[complaint.id] = existing.model_copy(
                    update={"internal_notes": internal_notes}
                )

                note_count += 1

    print(f"   Created {note_count} internal notes")


def create_demo_notifications(db, users):
    """Create sample notifications for users."""
    from app.models import Notification

    notification_templates = [
        {"title": "New Assignment", "message": "You have been assigned to a new complaint", "type": "info"},
        {"title": "SLA Warning", "message": "Complaint #X is approaching SLA deadline", "type": "warning"},
        {"title": "Complaint Resolved", "message": "Complaint #X has been marked as resolved", "type": "success"},
        {"title": "System Update", "message": "System maintenance scheduled for this weekend", "type": "info"},
    ]

    admin_users = [u for u in db.list_users() if u.role in [Role.admin, Role.super_admin]]

    notification_count = 0
    for user in admin_users:
        # Create 2-4 notifications per admin user
        num_notifications = randint(2, 4)
        for _ in range(num_notifications):
            template = choice(notification_templates)
            hours_ago = randint(1, 168)
            created_at = datetime.utcnow() - timedelta(hours=hours_ago)

            notification = Notification(
                id=db._next_id("notification"),
                user_id=user.id,
                title=template["title"],
                message=template["message"],
                type=template["type"],
                link=None,
                is_read=hours_ago > 48,  # Mark older notifications as read
                created_at=created_at,
                read_at=created_at + timedelta(hours=randint(1, 24)) if hours_ago > 48 else None,
            )

            db.notifications[notification.id] = notification
            notification_count += 1

    print(f"   Created {notification_count} notifications")


if __name__ == "__main__":
    seed_demo_data()
