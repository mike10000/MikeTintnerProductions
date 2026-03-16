-- Digital Services Agreement template for new website clients
insert into public.contract_templates (name, slug, description, content)
values (
  'Digital Services Agreement',
  'digital-services',
  'Website design and development contract. Admin enters project price. Client provides date and signature.',
  E'Digital Services Agreement

This Digital Services Agreement (the "Agreement") is entered into as of {{DATE}}, by and between:

The Provider: Mike Tintner Productions

The Client: {{CLIENT_NAME}}

1. Scope of Work
Mike Tintner Productions (the "Provider") agrees to provide professional web design and development services as outlined below:

- Custom UI/UX Design and Branding Integration.
- Mobile-Responsive Front-end Development.
- Back-end Configuration and Content Management System (CMS) Setup.
- Pre-launch Quality Assurance (QA) and Performance Testing.

2. Fees and Payment Terms
The Client agrees to pay the Provider the total sum of {{PRICE}} for the completion of the project.

Deposit: A non-refundable commencement fee of 50% is due upon signing.

Milestones: Remaining payments shall be made according to the following schedule: 50% upon Prototype Approval, 50% upon Launch.

Late Fees: Payments delayed beyond 14 days of the invoice date will incur a late fee of 1.5% per month.

3. Client Responsibilities
The timely completion of the project is dependent on the Client''s cooperation. The Client agrees to provide all necessary "Assets" (copy, high-resolution imagery, logos, and login credentials) within 14 days of the project start date. Delays in asset delivery may result in a rescheduled launch date.

4. Intellectual Property
Transfer of Rights: Upon final payment, the full ownership and copyright of the custom visual design and website code shall transfer to the Client.

Portfolio Rights: The Provider retains the right to display screenshots and links to the completed project in professional portfolios and marketing materials.

5. Revision Policy
The project fee includes 2 rounds of minor revisions during the design phase. Requests for significant structural changes or features outside the initial "Scope of Work" will be billed at an hourly rate of $75.

6. Limitation of Liability
Mike Tintner Productions shall not be liable for any indirect, incidental, or consequential damages (including loss of profit) arising out of the services provided. The Provider does not guarantee specific search engine rankings or third-party API uptime.

7. Termination
Either party may terminate this Agreement with 14 days'' written notice. In the event of termination, the Client shall pay the Provider for all work completed up to the date of termination.

___________________________
Client Signature

___________________________
Date'
)
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  content = excluded.content;
