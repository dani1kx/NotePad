$(document).ready(function() {
    loadNotes();
    
    $('#addNote').click(function() {
        const title = $('#noteTitle').val().trim();
        const content = $('#noteContent').val().trim();
        
        if (title && content) {
            addNote(title, content, false, new Date());
            $('#noteTitle, #noteContent').val('');
            loadNotes(); // Reload to show proper empty state if needed
        } else {
            alert('Please fill in both title and content!');
        }
    });
    
    
    $('#showAll').click(function() {
        loadNotes();
    });
    
    $('#showActive').click(function() {
        const notes = JSON.parse(localStorage.getItem('notes')) || [];
        const activeNotes = notes.filter(note => !note.isArchived);
        $('#notesList').empty();
        
        if (activeNotes.length === 0) {
            $('#notesList').html('<p style="text-align: center; color: #666; padding: 40px;">No active notes.</p>');
        } else {
            activeNotes.forEach(note => {
                displayNote(note);
            });
        }
    });
    
    $('#showArchived').click(function() {
        const notes = JSON.parse(localStorage.getItem('notes')) || [];
        const archivedNotes = notes.filter(note => note.isArchived);
        $('#notesList').empty();
        
        if (archivedNotes.length === 0) {
            $('#notesList').html('<p style="text-align: center; color: #666; padding: 40px;">No archived notes.</p>');
        } else {
            archivedNotes.forEach(note => {
                displayNote(note);
            });
        }
    });
    
    function addNote(title, content, isArchived = false, date = new Date()) {
        const noteId = Date.now();
        const note = {
            id: noteId,
            title: title,
            content: content,
            date: date,
            isArchived: isArchived
        };
        
        let notes = JSON.parse(localStorage.getItem('notes')) || [];
        notes.push(note);
        localStorage.setItem('notes', JSON.stringify(notes));
        
        displayNote(note);
    }
    
    function displayNote(note) {
        const noteElement = $(`
            <div class="note ${note.isArchived ? 'archived' : ''}" data-id="${note.id}">
                <div class="note-title" contenteditable="false">${note.title}</div>
                <div class="note-content" contenteditable="false">${parseMarkdown(note.content)}</div>
                <div class="note-date">Created: ${new Date(note.date).toLocaleString()}</div>
                <div class="note-actions">
                    <button class="edit-btn">Edit</button>
                    <button class="save-btn" style="display: none;">Save</button>
                    <button class="archive-btn">${note.isArchived ? 'Unarchive' : 'Archive'}</button>
                    <button class="delete-btn">Delete</button>
                </div>
            </div>
        `);
        
        $('#notesList').prepend(noteElement);
        
        noteElement.find('.edit-btn').click(function() {
            toggleEditMode(noteElement);
        });
        
        noteElement.find('.archive-btn').click(function() {
            toggleArchiveNote(noteElement);
        });
        
        noteElement.find('.delete-btn').click(function() {
            deleteNote(noteElement);
        });
        
        
        noteElement.find('.save-btn').click(function() {
            saveNoteChanges(noteElement);
        });
        
        
        noteElement.on('keydown', '.note-title, .note-content', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                saveNoteChanges(noteElement);
            }
        });
    }
    
    function toggleEditMode(noteElement) {
        const wasEditing = noteElement.hasClass('editing');
        const noteId = noteElement.data('id');
        let notes = JSON.parse(localStorage.getItem('notes'));
        const note = notes.find(n => n.id == noteId);
        
        if (wasEditing) {
            
            noteElement.removeClass('editing');
            noteElement.find('.note-title, .note-content').attr('contenteditable', false);
            
            noteElement.find('.edit-btn').show();
            noteElement.find('.save-btn').hide();
        } else {
            
            noteElement.addClass('editing');
            noteElement.find('.note-title').attr('contenteditable', true);
            noteElement.find('.note-content').attr('contenteditable', true).text(note.content);
            
            noteElement.find('.edit-btn').hide();
            noteElement.find('.save-btn').show();
            noteElement.find('.note-title').focus();
        }
    }
    
    function toggleArchiveNote(noteElement) {
        const noteId = noteElement.data('id');
        let notes = JSON.parse(localStorage.getItem('notes'));
        
        const noteIndex = notes.findIndex(note => note.id == noteId);
        if (noteIndex !== -1) {
            notes[noteIndex].isArchived = !notes[noteIndex].isArchived;
            localStorage.setItem('notes', JSON.stringify(notes));
            
            noteElement.toggleClass('archived');
            noteElement.find('.archive-btn').text(notes[noteIndex].isArchived ? 'Unarchive' : 'Archive');
        }
    }
    
    function deleteNote(noteElement) {
        const noteId = noteElement.data('id');
        let notes = JSON.parse(localStorage.getItem('notes'));
        
        notes = notes.filter(note => note.id != noteId);
        localStorage.setItem('notes', JSON.stringify(notes));
        
        noteElement.remove();
        
        // Check if there are any notes left and reload if needed
        const remainingNotes = JSON.parse(localStorage.getItem('notes')) || [];
        if (remainingNotes.length === 0) {
            loadNotes();
        }
    }
    
    function saveNoteChanges(noteElement) {
        const noteId = noteElement.data('id');
        let notes = JSON.parse(localStorage.getItem('notes'));
        
        const noteIndex = notes.findIndex(note => note.id == noteId);
        if (noteIndex !== -1) {
            const newTitle = noteElement.find('.note-title').text();
            const newContent = noteElement.find('.note-content').text();
            
            
            if (notes[noteIndex].title !== newTitle || notes[noteIndex].content !== newContent) {
                notes[noteIndex].title = newTitle;
                notes[noteIndex].content = newContent;
                notes[noteIndex].date = new Date();
                
                localStorage.setItem('notes', JSON.stringify(notes));
                noteElement.find('.note-date').text(`Updated: ${new Date(notes[noteIndex].date).toLocaleString()}`);
                
                // Update content display with markdown parsing
                noteElement.find('.note-content').attr('contenteditable', false).html(parseMarkdown(newContent));
            }
            
            
            noteElement.removeClass('editing');
            
            
            noteElement.find('.edit-btn').show();
            noteElement.find('.save-btn').hide();
        }
    }
    
    function parseMarkdown(text) {
        // Headers
        text = text.replace(/^### (.*$)/gim, '<h3>$1</h3>');
        text = text.replace(/^## (.*$)/gim, '<h2>$1</h2>');
        text = text.replace(/^# (.*$)/gim, '<h1>$1</h1>');
        
        // Bold
        text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        
        // Italic
        text = text.replace(/\*(.+?)\*/g, '<em>$1</em>');
        
        // Code blocks
        text = text.replace(/```([^`]+)```/g, '<pre><code>$1</code></pre>');
        
        // Inline code
        text = text.replace(/`([^`]+)`/g, '<code>$1</code>');
        
        // Blockquotes
        text = text.replace(/^> (.*$)/gim, '<blockquote>$1</blockquote>');
        
        // Unordered lists
        text = text.replace(/^\* (.+)$/gim, '<li>$1</li>');
        text = text.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
        
        // Ordered lists
        text = text.replace(/^\d+\. (.+)$/gim, '<li>$1</li>');
        
        // Line breaks
        text = text.replace(/\n\n/g, '</p><p>');
        text = '<p>' + text + '</p>';
        
        // Clean up empty paragraphs
        text = text.replace(/<p><\/p>/g, '');
        text = text.replace(/<p>(<h[1-6]>)/g, '$1');
        text = text.replace(/(<\/h[1-6]>)<\/p>/g, '$1');
        text = text.replace(/<p>(<ul>)/g, '$1');
        text = text.replace(/(<\/ul>)<\/p>/g, '$1');
        text = text.replace(/<p>(<ol>)/g, '$1');
        text = text.replace(/(<\/ol>)<\/p>/g, '$1');
        text = text.replace(/<p>(<blockquote>)/g, '$1');
        text = text.replace(/(<\/blockquote>)<\/p>/g, '$1');
        text = text.replace(/<p>(<pre>)/g, '$1');
        text = text.replace(/(<\/pre>)<\/p>/g, '$1');
        
        return text;
    }
    
    function loadNotes() {
        const notes = JSON.parse(localStorage.getItem('notes')) || [];
        $('#notesList').empty();
        
        notes.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        if (notes.length === 0) {
            $('#notesList').html('<p style="text-align: center; color: #666; padding: 40px;">No notes yet. Create your first note above!</p>');
        } else {
            notes.forEach(note => {
                displayNote(note);
            });
        }
    }
});
