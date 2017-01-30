import React, { Component } from 'react';
import '../css/App.css';
import $ from 'jquery';
import key from '../../secrets.js';
var parse = require('parse-link-header');

class App extends Component {

    state = {
        allIssues: [],
        error: null,
        contact: '',
        new: false,
        assignees: [],
        labels: ['bug', 'duplicate', 'enhancement', 'help wanted', 'invalid', 'question', 'wont fix'],
        console: 'initial load',
        repos: [],
        owner: '',
    };

    focus = true;
    url = 'https://api.github.com/';

    componentDidMount = () => {

        // get authenticated user's issues
        var github_url = this.url + 'issues';
        this.getIssues(github_url);

        window.Front.on('conversation', (data) => {
            // triggered when a conversation is loaded, returns contact object
            this.setState({
                contact: data.contact.display_name
            });

            // instead of querying github by email (requires user's email to be public),
            // return all of authenticated user's issues and filter by contact name
            // var email = data.contact.handle;
            // var payload = {
            //     "q": email,
            // };

            // var github_url = this.url + 'search/users';
            //
            // $.ajax({
            //     url: github_url,
            //     type: 'get',
            //     // data: payload,
            //     headers: {
            //         Authorization: 'token ' + this.refs.token.value,
            //     },
            //     contentType: 'application/json',
            //     success: (response) => {
            //         // instead of querying by issues with contact's public email, filter issues with contact name
            //         this.setState({
            //             contact: (response.items.length > 0 ? response.items[0].login : '')
            //         });
            //         this.getIssues();
            //     }
            // });
        });
    };

    getIssues = (url) => {

        var payload = {
            "filter": "all",
            "state": "all",
        };

        // GET returns all issues associated to authenticated user
        $.ajax({
            url: url,
            type: 'get',
            data: payload,
            headers: {
                Authorization: 'token ' + this.refs.token.value,
            },
            contentType: 'application/json',
            success: function(response, status, xhr) {
                console.log('all issues response ', response);
                if (response.length > 0) {
                    this.setState({
                        allIssues: this.state.allIssues.concat(response)
                    });
                }
                var pageUrls = parse(xhr.getResponseHeader("Link"));
                if (pageUrls.next) {
                    this.getIssues(pageUrls.next.url);
                }
            }.bind(this)
        });
    };

    showForm = () => {
        // display form to add a new github issue
        this.setState({
            new: true
        });
        // get repos from github
        var github_url = this.url + 'user/repos';
        this.getRepos(github_url);
    };

    getRepos = (url) => {

        $.ajax({
            url: url,
            type: 'get',
            headers: {
                Authorization: 'token ' + this.refs.token.value,
            },
            contentType: 'application/json',
            success: function(response, status, xhr) {

                var repos = response.map( (repo) => {
                    return repo.name;
                });
                var owner = response.map( (repo) => {
                    return repo.owner.login;
                });
                this.setState({
                    repos: this.state.repos.concat(repos),
                    owner: owner,
                });

                var pageUrls = parse(xhr.getResponseHeader("Link"));
                if (pageUrls.next) {
                    this.getRepos(pageUrls.next.url);
                }
            }.bind(this)
        });
    };

    // POST request to create a new github issue
    handleForm = (e) => {
        e.preventDefault();

        var title = this.refs['title'].value;
        var body = this.refs['body'].value;
        var label = this.refs['labels'].value;
        var repo = this.refs['repos'].value;

        if (title && body && repo && label) {
            var github_url = this.url + 'repos/' + this.state.owner + '/' + repo + '/issues';
            var data = {
                "title": title,
                "body": body,
                "labels": [label],
            };

            $.ajax({
                url: github_url,
                type: 'post',
                data: JSON.stringify(data),
                headers: {
                    Authorization: 'token ' + this.refs.token.value,
                },
                contentType: 'application/json',
                success: (response) => {
                    // console.log('add new issue ', response);
                    this.refs['user_form'].reset();
                    this.state.issues.unshift(response);
                    this.setState({
                        assignees: [],
                        issues: this.state.issues,
                    });
                }
            });

        } else {
            this.setState({
                error: 'Please enter Issue details.'
            });
        }
    };

    handleToggle = (issue) => {

        var github_url = issue.repository.url + '/issues/' + issue.number;

        var data = {
            state: issue.state === 'open' ? 'closed' : 'open',
        };

        $.ajax({
            url: github_url,
            type: 'PATCH',
            data: JSON.stringify(data),
            headers: {
                Authorization: 'token ' + this.refs.token.value,
            },
            contentType: 'application/json',
            success: (response) => {

                this.state.issues[this.getIssueIndex(response.number)].state = response.state;

                this.setState({
                    issues: this.state.issues,
                });
            }
        });
    };

    getIssueIndex = (issueNumber) => {

        var tempIssuesIndex = this.state.issues.map( (issue) => {
            return issue.number;
        });

        var index = tempIssuesIndex.indexOf(issueNumber);

        return index;

    };

    listAssignees = (issue) => {

        var github_url = issue.repository.url + '/assignees';

        $.ajax({
            url: github_url,
            type: 'get',
            headers: {
                Authorization: 'token ' + this.refs.token.value,
            },
            contentType: 'application/json',
            success: (response) => {
                this.setState({
                    assignees: response,
                });
            }
        });
    };

    handleReassign = (issue, e) => {

        var github_url = issue.repository.url + '/issues/' + issue.number;
        var data = {
            assignee: e.target.value,
        };

        $.ajax({
            url: github_url,
            type: 'patch',
            data: JSON.stringify(data),
            headers: {
                Authorization: 'token ' + this.refs.token.value,
            },
            contentType: 'application/json',
            success: (response) => {
                console.log(response);
            }
        });
    };

    render() {

        var issues = this.state.allIssues.filter( (issue) => {
            return (JSON.stringify(issue).search(this.state.contact) !== -1)
        }).map( (issue) => {

            var listItems = this.state.assignees.map( (person) => {
                return <option key={person.id} >{person.login}</option>
            });

            return (
                <li className="listed-issues cf" key={issue.id}>
                    #{issue.number} <a href={issue.html_url} target="_blank"> {issue.title} </a><br/>

                    <button className={'btn ' + (issue.state === 'open' ? 'close-button' : 'open-button')} onClick={this.handleToggle.bind(this, issue)}>{ issue.state === 'open' ? 'Close' : 'Reopen' }</button>

                    <div className="dropdown">
                        <select className="dropdown-content" onClick={this.listAssignees.bind(this, issue)} onChange={this.handleReassign.bind(this, issue)} defaultValue=''>
                            <option value="" disabled >{issue.assignee ? issue.assignee.login : 'Assign'}</option>
                            {listItems}
                        </select>
                    </div>
                </li>
            )
        });

        var labels = this.state.labels.map( (label) => {
            return <option key={label} >{label}</option>
        });

        var repositories = this.state.repos.map( (repo) => {
            return <option key={repo} >{repo}</option>
        });

        return (
            <div className="App">

                <input type="text" placeholder="personal access token" ref="token" defaultValue={key.githubToken} onChange={this.getIssues} autoFocus={this.focus} /><br/>

                <div>
                    <h4>Current issues</h4>
                    <button onClick={function(){window.location.reload();}}>Refresh</button>
                    <ul id="github-issues">
                        {issues ? issues : <br/>}
                        <button id='add-button' onClick={this.showForm}><i className="fa fa-plus" /></button>
                        <h4>new issue</h4>
                    </ul>

                </div>

                {this.state.new ?
                <form id="new-input" className='cf' ref="user_form" onSubmit={this.handleForm} >
                    <input type="text" placeholder="Issue title" ref="title" /><br/>
                    <input type="text" placeholder="Issue body" ref="body" /><br/>
                    <div className="dropdown">
                        <select className="dropdown-content" defaultValue='' ref='labels' >
                            <option value="" disabled >Labels</option>
                            {labels}
                        </select>
                        <select className="dropdown-content" defaultValue='' ref='repos' >
                            <option value='' disabled >Repos</option>
                            {repositories}
                        </select>
                    </div>
                    {this.state.error ? <div><span>{this.state.error}</span><br/></div> : null}
                    <button id="new-issue" type='submit' >Add to GitHub</button>
                </form>
                    : null }
            </div>
        );
    }
}

export default App;


