from flask import jsonify

def success_response(data=None, message='Success', status_code=200):
    """
    Standard success response format
    
    Args:
        data: Response data (dict, list, or None)
        message: Success message (string)
        status_code: HTTP status code (int)
    
    Returns:
        Flask JSON response tuple
    """
    response = {
        'status': 'success',
        'message': message
    }
    
    if data is not None:
        response['data'] = data
    
    return jsonify(response), status_code


def error_response(message='An error occurred', status_code=400):
    """
    Standard error response format
    
    Args:
        message: Error message (string)
        status_code: HTTP status code (int)
    
    Returns:
        Flask JSON response tuple
    """
    return jsonify({
        'status': 'error',
        'message': message
    }), status_code
