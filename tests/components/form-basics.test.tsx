import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { Button, Form, Input } from '../../packages/ui/src/components/form';

describe('Essential Form Components', () => {
  describe('Button', () => {
    it('should handle clicks', async () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Click me</Button>);
      
      await userEvent.click(screen.getByRole('button'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should show loading state', () => {
      render(<Button loading>Save</Button>);
      expect(screen.getByRole('button')).toBeDisabled();
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });

  describe('Input', () => {
    it('should accept user input', async () => {
      const handleChange = vi.fn();
      render(<Input label="Name" onChange={handleChange} />);
      
      const input = screen.getByLabelText('Name');
      await userEvent.type(input, 'John');
      
      expect(handleChange).toHaveBeenCalled();
      expect(input).toHaveValue('John');
    });

    it('should show validation errors', () => {
      render(<Input label="Email" error="Invalid email" />);
      expect(screen.getByText('Invalid email')).toBeInTheDocument();
    });
  });

  describe('Form', () => {
    it('should submit form data', async () => {
      const handleSubmit = vi.fn();
      render(
        <Form onSubmit={handleSubmit}>
          <Input name="email" label="Email" />
          <Button type="submit">Submit</Button>
        </Form>
      );

      await userEvent.type(screen.getByLabelText('Email'), 'test@example.com');
      await userEvent.click(screen.getByRole('button', { name: 'Submit' }));

      expect(handleSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'test@example.com',
        })
      );
    });

    it('should validate required fields', async () => {
      const handleSubmit = vi.fn();
      render(
        <Form onSubmit={handleSubmit}>
          <Input name="email" label="Email" required />
          <Button type="submit">Submit</Button>
        </Form>
      );

      await userEvent.click(screen.getByRole('button', { name: 'Submit' }));

      expect(handleSubmit).not.toHaveBeenCalled();
      expect(screen.getByText('This field is required')).toBeInTheDocument();
    });
  });
});