
# Resources and Research Enhancements — Walkthrough

## What Was Done

### 1. Resources Module
- **In-Platform Preview & Download**: Updated `ResourceDetail.jsx` to parse files and securely display inline documents via iframes or HTML5 video/audio tags. Implemented native blob downloads so users can save resources directly offline.
- **Bulk Upload & Multiple Descriptions**: Completely refactored `CreateResource.jsx` to allow multiple resource file uploads in one go. Each file now has its own distinct description and name field. The backend submission logic fires sequentially and correctly creates independent resource instances from a single form.

### 2. Research Backend Updates
**Files modified:** `Authentication/models.py`, `Research/models.py`, `Research/urls.py`, `Research/views.py`
- Added the `is_researcher` boolean control on `CustomUser`. Only verified researchers or staff can create projects.
- Created the **ResearcherApplication** cycle from API routes (`ResearcherApplicationViewSet`) down to the specific database tables.
- Updated `RecruitmentPost` `POST_TYPES` to explicitly accept `funding_requests` and `partners_sponsors`.
- Set up a base for Analytics retrieval.

### 3. Research Frontend Enhancements
- **Funding & Partners Search**: Reshaped the `Research.jsx` main page to include dynamic tabs filtering recruitment posts specifically for Participants, Funding Requests, and Partners & Sponsors. 
- **Application Portal**: Built `ApplyResearcher.jsx` form handling qualifications and document verification logic. If the user is unverified, this route facilitates the barrier to entry smoothly. Let the users submit their qualifications manually. 
- **Compensation & Details**: Added monetary metrics to the multi-step `CreateResearch.jsx` project creation page. Users can now state Paid vs Unpaid status, the amount, the currency being dealt in, and describe exactly what participants are getting. 
- **Project Updation**: Adjusted `CreateResearch.jsx` to recognize existing IDs, switch into editing mode seamlessly, and dispatch the payload utilizing a PATCH endpoint. 

## Testing Checklist
- [ ] Login and observe if 'Apply to be a Researcher' works. Try uploading a verification doc. 
- [ ] Ensure you're a confirmed researcher. Enter the Create Research page. Try appending Milestones and observing the Participant Compensation fields. Try modifying an already existing project.
- [ ] Create a multi-item package on `CreateResource.jsx`. Check that separate instances are created.
- [ ] Enter a Resource and test the document viewing box + the **Save Offline** button.
- [ ] Go back to Research, iterate through all tabs to see active posts and data rendering.
