# 5-6. ERD & Thiết kế Database

## ERD Diagram

```mermaid
erDiagram
    roles ||--o{ users : has
    users ||--o{ audit_logs : creates
    departments ||--o{ classes : contains
    classes ||--o{ students : has
    departments ||--o{ students : belongs
    students ||--o| union_books : owns
    union_books ||--o{ book_status_logs : tracks
    union_books ||--o| book_locations : stored_at
    storage_cabinets ||--o{ storage_shelves : has
    storage_shelves ||--o{ storage_boxes : has
    storage_boxes ||--o{ book_locations : contains
    collection_campaigns ||--o{ collection_details : includes
    collection_campaigns ||--o{ campaign_departments : targets
    departments ||--o{ campaign_departments : participates
    union_books ||--o{ collection_details : submitted_in
    borrow_forms ||--o{ borrow_items : contains
    union_books ||--o{ borrow_items : borrowed
    handover_forms ||--o{ handover_items : contains
    union_books ||--o{ handover_items : handed
    inventory_checks ||--|| union_books : checks
    notifications ||--o{ users : sent_to
    attachments ||--o{ union_books : attached

    roles {
        int id PK
        string name UK
        string code UK
        string description
    }

    users {
        int id PK
        int role_id FK
        int department_id FK
        string username UK
        string email UK
        string password_hash
        string full_name
        boolean is_active
        datetime created_at
    }

    departments {
        int id PK
        string name
        string code UK
        string faculty
        boolean is_active
    }

    classes {
        int id PK
        int department_id FK
        string name
        string cohort
    }

    students {
        int id PK
        string mssv UK
        string full_name
        date date_of_birth
        string cohort
        int class_id FK
        int department_id FK
        date union_join_date
        date admission_date
        string email
        string phone
        string status
    }

    union_books {
        int id PK
        string book_code UK
        string qr_code UK
        string barcode UK
        int student_id FK
        int department_id FK
        string cohort
        string status
        int location_id FK
        datetime created_at
        datetime updated_at
    }

    book_locations {
        int id PK
        int box_id FK
        int book_id FK UK
        string full_path
    }

    storage_cabinets {
        int id PK
        string name UK
        string location_note
    }

    storage_shelves {
        int id PK
        int cabinet_id FK
        string name
    }

    storage_boxes {
        int id PK
        int shelf_id FK
        string name
        int capacity
    }

    collection_campaigns {
        int id PK
        string name
        string semester
        date start_date
        date end_date
        int manager_id FK
        string status
    }

    collection_details {
        int id PK
        int campaign_id FK
        int book_id FK
        int department_id FK
        datetime registered_at
        datetime received_at
        string status
    }

    inventory_checks {
        int id PK
        int book_id FK
        int checker_id FK
        boolean missing_photo
        boolean missing_stamp
        boolean missing_signature
        boolean wrong_info
        boolean torn
        boolean missing_pages
        string other_notes
        string result
        datetime checked_at
    }

    borrow_forms {
        int id PK
        int borrower_id FK
        string reason
        date borrow_date
        date due_date
        date return_date
        string status
    }

    handover_forms {
        int id PK
        int giver_id FK
        int receiver_id FK
        int department_id FK
        string status
        datetime signed_at
    }

    book_status_logs {
        int id PK
        int book_id FK
        string from_status
        string to_status
        int actor_id FK
        string note
        string ip_address
        string device
        datetime created_at
    }

    audit_logs {
        int id PK
        int user_id FK
        string action
        string entity_type
        int entity_id
        json old_value
        json new_value
        string ip_address
        string device
        datetime created_at
    }

    notifications {
        int id PK
        int user_id FK
        string title
        string message
        string type
        boolean is_read
        datetime created_at
    }
```

## Indexes quan trọng

| Bảng | Index | Mục đích |
|------|-------|----------|
| union_books | status, department_id, cohort | Filter dashboard |
| union_books | qr_code, barcode, book_code | Tra cứu nhanh |
| students | mssv | Tra cứu MSSV |
| book_status_logs | book_id, created_at | Timeline |
| audit_logs | user_id, created_at | Audit trail |
| collection_details | campaign_id, status | Tiến độ đợt thu |

## Ràng buộc

- `union_books.student_id` UNIQUE (1 sổ/1 đoàn viên active)
- `book_locations.book_id` UNIQUE (1 vị trí/1 sổ)
- Status transitions validated ở Service layer
- Soft delete không dùng — dùng status `MISSING`/`DAMAGED`
