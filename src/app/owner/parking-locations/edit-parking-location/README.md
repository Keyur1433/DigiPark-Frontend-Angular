# Edit Parking Location Component

This component provides functionality for editing existing parking locations in the owner dashboard.

## Integration Steps

1. **File Structure**
   - The component is located at `parking-app-front-end/src/app/owner/parking-locations/edit-parking-location/`
   - It consists of the following files:
     - `edit-parking-location.component.ts` - Component logic
     - `edit-parking-location.component.html` - Component template
     - `edit-parking-location.component.css` - Component styling

2. **Route Configuration**
   - To enable the edit route, uncomment the edit route in `parking-app-front-end/src/app/owner/owner.routes.ts`:
   ```typescript
   {
     path: 'parking-locations/:locationId/edit',
     loadComponent: () => import('./parking-locations/edit-parking-location/edit-parking-location.component').then(m => m.EditParkingLocationComponent),
     title: 'Edit Parking Location'
   },
   ```

3. **Owner Service**
   - The component relies on the `updateParkingLocation` method in the `OwnerService`
   - This method should be added to `parking-app-front-end/src/app/services/owner.service.ts`

4. **Backend API Endpoint**
   - The backend should implement a PUT endpoint at `/api/parking-locations/{id}` to handle updates
   - The request body should follow the `ParkingLocationCreate` interface structure

5. **UI Integration**
   - Replace the disabled edit button in `owner-parking-locations.component.ts` with the router link:
   ```html
   <a [routerLink]="['/owner', userId, 'parking-locations', location.id, 'edit']" 
      class="btn btn-sm btn-outline-primary">
     Edit
   </a>
   ```

## Form Field Mapping

The component maps backend field names to form fields as follows:

| Backend Field Name | Form Field Name |
|--------------------|-----------------|
| name | name |
| address | address |
| city | city |
| state | state |
| pincode | zip_code |
| latitude | latitude |
| longitude | longitude |
| two_wheeler_capacity | two_wheeler_capacity |
| four_wheeler_capacity | four_wheeler_capacity |
| two_wheeler_price_per_hour | two_wheeler_hourly_rate |
| four_wheeler_price_per_hour | four_wheeler_hourly_rate |

## Testing

1. To test the component:
   - Ensure the backend API endpoints are properly implemented and respond with the correct data structures
   - Navigate to the owner parking locations page
   - Click the "Edit" button on a parking location row
   - Verify the form loads and displays the correct data
   - Make changes and submit the form
   - Verify the changes are reflected in the parking locations list 