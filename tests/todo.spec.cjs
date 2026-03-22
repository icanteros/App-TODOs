const { test, expect } = require('@playwright/test');

test.describe('TODO App', () => {
  test.beforeEach(async ({ page }) => {
    // Go to the starting url before each test.
    await page.goto('/');
    
    // Wait for the app to finish loading (e.g. "Cargando..." disappears)
    await expect(page.getByText('Cargando…')).not.toBeVisible({ timeout: 10000 });
  });

  test('should display main heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Tareas' })).toBeVisible();
  });

  test('should allow adding a new todo', async ({ page }) => {
    // We add a unique string to avoid conflicts if tests run repeatedly
    const uniqueTitle = `Test Todo ${Date.now()}`;
    
    // Fill the input
    const input = page.getByPlaceholder('¿Qué necesitás hacer?');
    await input.fill(uniqueTitle);
    
    // Submit
    await page.getByRole('button', { name: 'Agregar' }).click();
    
    // Verify it appears in the list
    await expect(page.getByText(uniqueTitle)).toBeVisible();
  });

  test('should allow toggling a test todo', async ({ page }) => {
    const uniqueTitle = `Toggle Todo ${Date.now()}`;
    await page.getByPlaceholder('¿Qué necesitás hacer?').fill(uniqueTitle);
    await page.getByRole('button', { name: 'Agregar' }).click();

    // Verify it was added
    const todoItem = page.locator('li', { hasText: uniqueTitle });
    await expect(todoItem).toBeVisible();

    // Mark as completed
    const toggleButton = todoItem.getByRole('button', { name: 'Marcar como completada' });
    await toggleButton.click();

    // Verify it is completed (has the line-through class or the opposite accessible name)
    await expect(todoItem.getByRole('button', { name: 'Marcar como pendiente' })).toBeVisible();
  });

  test('should allow deleting a test todo', async ({ page }) => {
    const uniqueTitle = `Delete Todo ${Date.now()}`;
    await page.getByPlaceholder('¿Qué necesitás hacer?').fill(uniqueTitle);
    await page.getByRole('button', { name: 'Agregar' }).click();

    const todoItem = page.locator('li', { hasText: uniqueTitle });
    await expect(todoItem).toBeVisible();

    // Hover to reveal the delete button
    await todoItem.hover();
    
    // Click the delete button
    await todoItem.getByRole('button', { name: 'Eliminar tarea' }).click();

    // Verify it is removed
    await expect(todoItem).not.toBeVisible();
  });
});
