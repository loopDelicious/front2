import React, { Component } from 'react';
import '../css/App.css';
import $ from 'jquery';
import key from '../../secrets.js';

class App extends Component {

    state = {
        issues: [],
        error: null,
        new: false
    };

    focus = true;

    // display a list of github issues
    componentDidUpdate = () => {

        var url = 'https://api.github.com/repos/loopDelicious/front2/issues';

        $.ajax({
            url: url,
            type: 'get',
            contentType: 'application/json',
            success: (response) => {
                console.log(response);
                var issues = [];
                response.forEach( (issue) => {
                    issues.push(issue);
                });
                this.setState({
                    issues: issues,
                });
            }
        });
    };

    // display form to add a new github issue
    showForm = () => {
        this.setState({
            new: true
        });
    };

    // POST request to create a new github issue
    handleForm = (e) => {
        e.preventDefault();

        var title = this.refs['title'].value;
        var body = this.refs['body'].value;

        if (title && body) {
            var url = 'https://api.github.com/repos/loopDelicious/front2/issues';
            var data = {
                "title": title,
                "body": body
            };

            $.ajax({
                url: url,
                type: 'post',
                body: data,
                headers: {
                    Authorization: 'token ' + key.githubToken,
                },
                contentType: 'application/json',
                success: (response) => {
                    console.log(response);
                    this.refs['user_form'].reset();
                }
            });
        } else {

            this.setState({
                error: 'Please enter Issue details.'
            });
        }
    };

    render() {

        var issues = this.state.issues.map( (issue) => {

            return (
                <li className="listed-issues"><a href={issue.html_url} target="_blank">Issue
                    #{issue.number} {issue.title} </a></li>
            )
        });

        return (
            <div className="App">

                <div>
                    <h4>Current issues</h4>
                    <ul id="github-issues">
                        {this.state.issues ? issues : <br/>}
                        <button id='add-button' onClick={this.showForm}><i className="fa fa-plus" /></button>
                    </ul>

                </div>

                {this.state.new ?
                <form id="new-input" ref="user_form" onSubmit={this.handleForm} >
                    <h4>Create a new issue</h4>
                    <input type="text" placeholder="Issue title" ref="title" autoFocus={this.focus} /><br/>
                    <input type="text" placeholder="Issue body" ref="body" /><br/>
                    {this.state.error ? <div><span>{this.state.error}</span><br/></div> : null}
                    <button id="new-issue" type='submit' >Add to GitHub</button>
                </form>
                    : null }

            </div>
        );
    }
}

export default App;

// var url = 'https://github.com/login/oauth/authorize';
// window.Front.openUrl(url);
//
// Front.on('conversation', function(data) {
//     console.log('Conversation', data.conversation);
//     console.log('Contact', data.contact);
//     console.log('Message', data.message);
//     console.log('OtherMessages', data.otherMessages);
//     conversation = data.conversation;
// });

