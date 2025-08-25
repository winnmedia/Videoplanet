/**
 * Enhanced Video Player Test Suite
 * TDD approach: Tests written before implementation
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { EnhancedVideoPlayer } from '../EnhancedVideoPlayer'
import { VideoPlayerProps } from '../../model/types'

// Mock HTMLMediaElement methods
beforeAll(() => {
  HTMLMediaElement.prototype.play = jest.fn().mockResolvedValue(undefined)
  HTMLMediaElement.prototype.pause = jest.fn()
  HTMLMediaElement.prototype.load = jest.fn()
  
  // Mock canvas for screenshot functionality
  HTMLCanvasElement.prototype.getContext = jest.fn().mockReturnValue({
    drawImage: jest.fn(),
    toDataURL: jest.fn().mockReturnValue('data:image/png;base64,mock')
  })
})

describe('EnhancedVideoPlayer', () => {
  const defaultProps: VideoPlayerProps = {
    videoUrl: '/test-video.mp4',
    onVideoUpload: jest.fn(),
    onVideoReplace: jest.fn(),
    onTimestampFeedback: jest.fn(),
    onScreenshot: jest.fn(),
    onShare: jest.fn(),
    showEnhancedControls: true
  }

  describe('Basic Rendering', () => {
    it('should render video element when videoUrl is provided', () => {
      render(<EnhancedVideoPlayer {...defaultProps} />)
      const videoElement = screen.getByTestId('video-player')
      expect(videoElement).toBeInTheDocument()
      expect(videoElement).toHaveAttribute('src', '/test-video.mp4')
    })

    it('should render upload prompt when no video is provided', () => {
      render(<EnhancedVideoPlayer {...defaultProps} videoUrl={null} />)
      expect(screen.getByTestId('video-upload-prompt')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /upload video/i })).toBeInTheDocument()
    })

    it('should apply custom className', () => {
      const { container } = render(
        <EnhancedVideoPlayer {...defaultProps} className="custom-class" />
      )
      expect(container.firstChild).toHaveClass('custom-class')
    })
  })

  describe('Control Buttons with Tooltips', () => {
    it('should render all control buttons with proper tooltips', async () => {
      render(<EnhancedVideoPlayer {...defaultProps} />)
      
      // Check for upload button with tooltip
      const uploadButton = screen.getByTestId('video-upload-button')
      expect(uploadButton).toBeInTheDocument()
      expect(uploadButton).toHaveAttribute('aria-label', 'Upload new video')
      
      // Hover to show tooltip
      await userEvent.hover(uploadButton)
      await waitFor(() => {
        expect(screen.getByRole('tooltip', { name: /upload new video/i })).toBeInTheDocument()
      })

      // Check for replace button
      const replaceButton = screen.getByTestId('video-replace-button')
      expect(replaceButton).toBeInTheDocument()
      expect(replaceButton).toHaveAttribute('aria-label', 'Replace current video')

      // Check for feedback button
      const feedbackButton = screen.getByTestId('video-feedback-button')
      expect(feedbackButton).toBeInTheDocument()
      expect(feedbackButton).toHaveAttribute('aria-label', 'Add feedback at current time')

      // Check for screenshot button
      const screenshotButton = screen.getByTestId('video-screenshot-button')
      expect(screenshotButton).toBeInTheDocument()
      expect(screenshotButton).toHaveAttribute('aria-label', 'Take screenshot')

      // Check for share button
      const shareButton = screen.getByTestId('video-share-button')
      expect(shareButton).toBeInTheDocument()
      expect(shareButton).toHaveAttribute('aria-label', 'Share video')
    })

    it('should show tooltips on hover', async () => {
      render(<EnhancedVideoPlayer {...defaultProps} />)
      
      const buttons = [
        { testId: 'video-upload-button', tooltip: 'Upload new video' },
        { testId: 'video-replace-button', tooltip: 'Replace current video' },
        { testId: 'video-feedback-button', tooltip: 'Add feedback at current time' },
        { testId: 'video-screenshot-button', tooltip: 'Take screenshot' },
        { testId: 'video-share-button', tooltip: 'Share video' }
      ]

      for (const button of buttons) {
        const element = screen.getByTestId(button.testId)
        await userEvent.hover(element)
        await waitFor(() => {
          expect(screen.getByText(button.tooltip)).toBeInTheDocument()
        })
        await userEvent.unhover(element)
      }
    })
  })

  describe('Video Upload Functionality', () => {
    it('should handle video upload through upload button', async () => {
      const onVideoUpload = jest.fn()
      render(<EnhancedVideoPlayer {...defaultProps} onVideoUpload={onVideoUpload} videoUrl={null} />)
      
      const file = new File(['video'], 'test.mp4', { type: 'video/mp4' })
      const uploadButton = screen.getByTestId('video-upload-button')
      const input = screen.getByTestId('video-upload-input') as HTMLInputElement
      
      await userEvent.upload(input, file)
      
      expect(onVideoUpload).toHaveBeenCalledWith(file)
    })

    it('should validate video file type', async () => {
      render(<EnhancedVideoPlayer {...defaultProps} videoUrl={null} />)
      
      const file = new File(['content'], 'test.txt', { type: 'text/plain' })
      const input = screen.getByTestId('video-upload-input') as HTMLInputElement
      
      await userEvent.upload(input, file)
      
      expect(screen.getByText(/please select a valid video file/i)).toBeInTheDocument()
    })

    it('should show file size limit warning for large files', async () => {
      render(<EnhancedVideoPlayer {...defaultProps} videoUrl={null} />)
      
      // Create a mock large file (over 500MB)
      const largeFile = new File(['x'.repeat(600 * 1024 * 1024)], 'large.mp4', { type: 'video/mp4' })
      Object.defineProperty(largeFile, 'size', { value: 600 * 1024 * 1024 })
      
      const input = screen.getByTestId('video-upload-input') as HTMLInputElement
      
      await userEvent.upload(input, largeFile)
      
      expect(screen.getByText(/file size exceeds 500MB limit/i)).toBeInTheDocument()
    })
  })

  describe('Video Replace Functionality', () => {
    it('should handle video replacement', async () => {
      const onVideoReplace = jest.fn()
      render(<EnhancedVideoPlayer {...defaultProps} onVideoReplace={onVideoReplace} />)
      
      const file = new File(['new-video'], 'new.mp4', { type: 'video/mp4' })
      const replaceButton = screen.getByTestId('video-replace-button')
      
      fireEvent.click(replaceButton)
      
      const input = screen.getByTestId('video-replace-input') as HTMLInputElement
      await userEvent.upload(input, file)
      
      expect(onVideoReplace).toHaveBeenCalledWith(file)
    })

    it('should show confirmation dialog before replacing', async () => {
      render(<EnhancedVideoPlayer {...defaultProps} />)
      
      const replaceButton = screen.getByTestId('video-replace-button')
      fireEvent.click(replaceButton)
      
      expect(screen.getByText(/are you sure you want to replace/i)).toBeInTheDocument()
      
      const confirmButton = screen.getByRole('button', { name: /confirm/i })
      fireEvent.click(confirmButton)
      
      expect(screen.getByTestId('video-replace-input')).toBeInTheDocument()
    })
  })

  describe('Timestamp Feedback Functionality', () => {
    it('should capture current timestamp when feedback button is clicked', async () => {
      const onTimestampFeedback = jest.fn()
      const { container } = render(
        <EnhancedVideoPlayer {...defaultProps} onTimestampFeedback={onTimestampFeedback} />
      )
      
      const video = container.querySelector('video') as HTMLVideoElement
      Object.defineProperty(video, 'currentTime', {
        writable: true,
        value: 45.5
      })
      
      const feedbackButton = screen.getByTestId('video-feedback-button')
      fireEvent.click(feedbackButton)
      
      expect(onTimestampFeedback).toHaveBeenCalledWith(45.5)
    })

    it('should display current timestamp in tooltip', async () => {
      const { container } = render(<EnhancedVideoPlayer {...defaultProps} />)
      
      const video = container.querySelector('video') as HTMLVideoElement
      Object.defineProperty(video, 'currentTime', {
        writable: true,
        value: 125 // 2:05
      })
      
      // Trigger time update
      fireEvent.timeUpdate(video)
      
      const feedbackButton = screen.getByTestId('video-feedback-button')
      await userEvent.hover(feedbackButton)
      
      await waitFor(() => {
        expect(screen.getByText(/Add feedback at 2:05/i)).toBeInTheDocument()
      })
    })
  })

  describe('Screenshot Functionality', () => {
    it('should take screenshot of current video frame', async () => {
      const onScreenshot = jest.fn()
      const { container } = render(
        <EnhancedVideoPlayer {...defaultProps} onScreenshot={onScreenshot} />
      )
      
      const video = container.querySelector('video') as HTMLVideoElement
      Object.defineProperty(video, 'currentTime', {
        writable: true,
        value: 30
      })
      
      const screenshotButton = screen.getByTestId('video-screenshot-button')
      fireEvent.click(screenshotButton)
      
      await waitFor(() => {
        expect(onScreenshot).toHaveBeenCalledWith(30, expect.stringContaining('data:image/png'))
      })
    })

    it('should show screenshot preview after capture', async () => {
      render(<EnhancedVideoPlayer {...defaultProps} />)
      
      const screenshotButton = screen.getByTestId('video-screenshot-button')
      fireEvent.click(screenshotButton)
      
      await waitFor(() => {
        expect(screen.getByTestId('screenshot-preview')).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /download screenshot/i })).toBeInTheDocument()
      })
    })

    it('should download screenshot when download button is clicked', async () => {
      render(<EnhancedVideoPlayer {...defaultProps} />)
      
      const screenshotButton = screen.getByTestId('video-screenshot-button')
      fireEvent.click(screenshotButton)
      
      await waitFor(() => {
        const downloadButton = screen.getByRole('button', { name: /download screenshot/i })
        fireEvent.click(downloadButton)
        
        // Check if download was triggered (mock implementation)
        expect(document.createElement).toHaveBeenCalledWith('a')
      })
    })
  })

  describe('Share Functionality', () => {
    it('should copy share link to clipboard', async () => {
      const mockClipboard = {
        writeText: jest.fn().mockResolvedValue(undefined)
      }
      Object.assign(navigator, { clipboard: mockClipboard })
      
      const onShare = jest.fn()
      render(<EnhancedVideoPlayer {...defaultProps} onShare={onShare} />)
      
      const shareButton = screen.getByTestId('video-share-button')
      fireEvent.click(shareButton)
      
      expect(onShare).toHaveBeenCalled()
      await waitFor(() => {
        expect(screen.getByText(/link copied to clipboard/i)).toBeInTheDocument()
      })
    })

    it('should show share options modal', async () => {
      render(<EnhancedVideoPlayer {...defaultProps} />)
      
      const shareButton = screen.getByTestId('video-share-button')
      fireEvent.click(shareButton)
      
      expect(screen.getByTestId('share-modal')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /copy link/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /share with timestamp/i })).toBeInTheDocument()
    })

    it('should include timestamp in share link when option is selected', async () => {
      const { container } = render(<EnhancedVideoPlayer {...defaultProps} />)
      
      const video = container.querySelector('video') as HTMLVideoElement
      Object.defineProperty(video, 'currentTime', {
        writable: true,
        value: 60
      })
      
      const shareButton = screen.getByTestId('video-share-button')
      fireEvent.click(shareButton)
      
      const timestampOption = screen.getByRole('checkbox', { name: /include timestamp/i })
      fireEvent.click(timestampOption)
      
      const copyButton = screen.getByRole('button', { name: /copy link/i })
      fireEvent.click(copyButton)
      
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        expect.stringContaining('?t=60')
      )
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<EnhancedVideoPlayer {...defaultProps} />)
      
      const player = screen.getByTestId('enhanced-video-player')
      expect(player).toHaveAttribute('role', 'region')
      expect(player).toHaveAttribute('aria-label', 'Video player with enhanced controls')
      
      const video = screen.getByTestId('video-player')
      expect(video).toHaveAttribute('aria-label', 'Video content')
    })

    it('should support keyboard navigation', async () => {
      render(<EnhancedVideoPlayer {...defaultProps} />)
      
      const uploadButton = screen.getByTestId('video-upload-button')
      uploadButton.focus()
      
      // Tab through controls
      await userEvent.tab()
      expect(screen.getByTestId('video-replace-button')).toHaveFocus()
      
      await userEvent.tab()
      expect(screen.getByTestId('video-feedback-button')).toHaveFocus()
      
      await userEvent.tab()
      expect(screen.getByTestId('video-screenshot-button')).toHaveFocus()
      
      await userEvent.tab()
      expect(screen.getByTestId('video-share-button')).toHaveFocus()
    })

    it('should announce status changes to screen readers', async () => {
      render(<EnhancedVideoPlayer {...defaultProps} />)
      
      const file = new File(['video'], 'test.mp4', { type: 'video/mp4' })
      const input = screen.getByTestId('video-upload-input') as HTMLInputElement
      
      await userEvent.upload(input, file)
      
      expect(screen.getByRole('status')).toHaveTextContent(/video uploaded successfully/i)
    })
  })

  describe('Error Handling', () => {
    it('should display error message when video fails to load', () => {
      const { container } = render(<EnhancedVideoPlayer {...defaultProps} />)
      
      const video = container.querySelector('video') as HTMLVideoElement
      fireEvent.error(video)
      
      expect(screen.getByRole('alert')).toHaveTextContent(/failed to load video/i)
    })

    it('should handle network errors gracefully', async () => {
      render(<EnhancedVideoPlayer {...defaultProps} videoUrl="http://invalid-url.mp4" />)
      
      const video = screen.getByTestId('video-player') as HTMLVideoElement
      fireEvent.error(video, { target: { error: { code: 2 } } })
      
      expect(screen.getByText(/network error/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
    })
  })

  describe('Loading States', () => {
    it('should show loading indicator while video is buffering', () => {
      const { container } = render(<EnhancedVideoPlayer {...defaultProps} />)
      
      const video = container.querySelector('video') as HTMLVideoElement
      fireEvent.loadStart(video)
      
      expect(screen.getByTestId('video-loading-indicator')).toBeInTheDocument()
      
      fireEvent.loadedData(video)
      
      expect(screen.queryByTestId('video-loading-indicator')).not.toBeInTheDocument()
    })
  })
})